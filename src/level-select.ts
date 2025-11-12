import { Scene, setScene } from "./scene-manager"
import { keys } from "./core/input"
import { levelsData } from "./data/level-data"
import { loadLevel } from "./level-manager"
import { pointInRect, lerp } from "./core/math"
import { startTransitionAnimation } from "./transition-animation"
import {
    HEIGHT,
    WIDTH,
    BLACK,
    GREEN,
    LGREEN,
    DBLUE,
    WHITE,
    BLUE,
    DDBLUE,
    DPURPLE,
    LYELLOW,
} from "./const"
import {
    createParticleSystem,
    updateParticles,
    renderParticles,
    ParticleSystem,
    emitUIParticles,
} from "./particle-system"
import { cam } from "./camera"
import { playMenuHoverSound, playMenuSelectSound } from "./synth"
import {
    renderScrollingBackdrop,
    updateScrollingBackdrop,
} from "./title-screen"

const GRID_SIZE = 200
const PADDING = 50
const START_X = 120
const START_Y = 150
const COLS = Math.floor((WIDTH - PADDING * 2) / (GRID_SIZE + PADDING))
const PARTICLE_COUNT = 32
const PARTICLE_SIZE = 16

let selectedLevel = 0
const levelScales: number[] = []
let celebrationParticles: ParticleSystem

export const initLevelSelect = () => {
    // Initialize scales for all levels
    for (let i = 0; i < levelsData.length; i++) {
        levelScales[i] = 1
    }
    // Initialize particle system for celebrations
    celebrationParticles = createParticleSystem(PARTICLE_SIZE, PARTICLE_COUNT)
    // reset camera
    cam.x = 0
    cam.y = 0

    startTransitionAnimation(WIDTH / 2, HEIGHT / 2, true, DDBLUE)
}


const startLevel = (levelIndex: number) => {
    selectedLevel = levelIndex
    startTransitionAnimation(WIDTH / 2, HEIGHT / 2, false, DDBLUE, () => {
        loadLevel(levelIndex)
        setScene(Scene.Game)
    })
}

const setHoveredLevel = (level: number) => {
    if (selectedLevel !== level) {
        selectedLevel = level
        playMenuHoverSound()
    }
}

export const updateLevelSelect = (dt: number) => {
    updateScrollingBackdrop(dt)
    // Update celebration particles
    updateParticles(celebrationParticles, dt)

    // Handle keyboard navigation
    if (keys.btnp.lf) {
        let newLevel = selectedLevel - 1
        while (newLevel >= 0) {
            newLevel--
        }
        if (newLevel >= 0) setHoveredLevel(newLevel)
    }
    if (keys.btnp.rt) {
        let newLevel = selectedLevel + 1
        while (newLevel < levelsData.length) {
            newLevel++
        }
        if (newLevel < levelsData.length) setHoveredLevel(newLevel)
    }
    if (keys.btnp.up) {
        let newLevel = selectedLevel - COLS
        while (newLevel >= 0) {
            newLevel -= COLS
        }
        if (newLevel >= 0) setHoveredLevel(newLevel)
    }
    if (keys.btnp.dn) {
        let newLevel = selectedLevel + COLS
        while (newLevel < levelsData.length) {
            newLevel += COLS
        }
        if (newLevel < levelsData.length) setHoveredLevel(newLevel)
    }

    // Handle level selection with space or enter
    if (keys.btnp.sel) {
        startLevel(selectedLevel)
    }

    // Handle level selection with pointer
    if (keys.btn.clk) {
        const levelIndex = getLevelAtPosition(keys.ptr.x, keys.ptr.y)
        if (
            levelIndex >= 0 &&
            levelIndex < levelsData.length
        ) {
            startLevel(levelIndex)
            playMenuSelectSound()
        }
    }

    // Update selected level on hover
    const hoveredLevel = getLevelAtPosition(keys.ptr.x, keys.ptr.y)
    if (hoveredLevel >= 0) {
        setHoveredLevel(hoveredLevel)
    }

    // Update scale targets and interpolate for all levels
    for (let i = 0; i < levelsData.length; i++) {
        const isThisLevelActive = i === selectedLevel
        const targetScale = isThisLevelActive ? 1.1 : 1
        levelScales[i] = lerp(levelScales[i], targetScale, 0.15)
    }
}

const getLevelAtPosition = (x: number, y: number): number => {
    for (let i = 0; i < levelsData.length; i++) {
        const col = i % COLS
        const row = Math.floor(i / COLS)

        const levelX = START_X + col * (GRID_SIZE + PADDING)
        const levelY = START_Y + row * (GRID_SIZE + PADDING)

        if (pointInRect(x, y, levelX, levelY, GRID_SIZE, GRID_SIZE)) {
            return i
        }
    }

    return -1
}

export const renderLevelSelect = (ctx: CanvasRenderingContext2D) => {
    renderScrollingBackdrop(ctx)

    ctx.roundRect(80, 100, WIDTH - 130, HEIGHT - 200, 25)
    ctx.fillStyle = DPURPLE
    ctx.fill()

    // Level grid
    const completedLevels = new Set<number>()
    for (let i = 0; i < levelsData.length; i++) {
        const col = i % COLS
        const row = Math.floor(i / COLS)

        const levelX = START_X + col * (GRID_SIZE + PADDING)
        const levelY = START_Y + row * (GRID_SIZE + PADDING)

        const isCompleted = false
        const isAvailable = true

        // Level box with smooth size change on hover
        const scaledSize = GRID_SIZE * levelScales[i]
        const scaledX = levelX - (scaledSize - GRID_SIZE) / 2
        const scaledY = levelY - (scaledSize - GRID_SIZE) / 2

        ctx.fillStyle = BLUE
        ctx.beginPath()
        ctx.roundRect(scaledX, scaledY, scaledSize, scaledSize, 8)
        ctx.closePath()
        ctx.fill()

        // Level border
        ctx.strokeStyle = DBLUE
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(scaledX, scaledY, scaledSize, scaledSize, 8)
        ctx.closePath()
        ctx.stroke()

        // Level number
        ctx.fillStyle = WHITE
        ctx.font = "24px Arial"
        ctx.textAlign = "center"
        ctx.fillText(
            (i + 1).toString(),
            scaledX + scaledSize / 2,
            scaledY + scaledSize / 2 + 8,
        )
    }

    // Render celebration particles
    ctx.fillStyle = LGREEN
    renderParticles(celebrationParticles, ctx)
}

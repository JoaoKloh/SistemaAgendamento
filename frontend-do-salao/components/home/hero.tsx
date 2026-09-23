"use client"

import Link from "next/link"
import Image from "next/image"
import { Star, MapPin, CalendarCheck } from "lucide-react"
import { salon } from "@/lib/data"
import { useEffect, useRef } from "react"

const HERO_CAROUSEL_IMAGES = [
  "/images/dvd_image_02.png",
  "/images/dvd_image_03.png",
  "/images/dvd_image_04.png",
  "/images/dvd_image_05.png",
  "/images/dvd_image_06.png",
]

const CAROUSEL_INTERVAL_MS = 4000
const CAROUSEL_CYCLE_MS = CAROUSEL_INTERVAL_MS * HERO_CAROUSEL_IMAGES.length

// Crossfade feita em CSS (compositor) em vez de setInterval + estado React,
// evitando re-render e trabalho de JS a cada troca de slide.
function HeroCarousel() {
  return (
    <div className="relative h-full w-full">
      {HERO_CAROUSEL_IMAGES.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={`${salon.name} - foto ${index + 1}`}
          fill
          priority={index === 0}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="hero-carousel-slide object-cover"
          style={{
            animationDuration: `${CAROUSEL_CYCLE_MS}ms`,
            animationDelay: `${-index * CAROUSEL_INTERVAL_MS}ms`,
          }}
        />
      ))}
    </div>
  )
}

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
uniform vec4 u_scene;      // resolution.xy, time, colour count
uniform vec4 u_shape;      // scale, intensity, paramA, warp
uniform vec4 u_surface;    // detail, contrast, brightness, saturation
uniform vec4 u_finish;     // hue, vignette, blur, grain
uniform vec4 u_transform;  // seed, rotation, drift, OKLab toggle
uniform vec4 u_space;      // offset.xy, pointer.xy
uniform vec4 u_cursor;

#define u_resolution u_scene.xy
#define u_time u_scene.z
#define u_colorCount u_scene.w
#define u_scale u_shape.x
#define u_intensity u_shape.y
#define u_paramA u_shape.z
#define u_warp u_shape.w
#define u_detail u_surface.x
#define u_contrast u_surface.y
#define u_brightness u_surface.z
#define u_saturation u_surface.w
#define u_hue u_finish.x
#define u_vignette u_finish.y
#define u_blur u_finish.z
#define u_grain u_finish.w
#define u_seed mod(u_transform.x, 31.0)
#define u_rotate u_transform.y
#define u_drift u_transform.z
#define u_oklab u_transform.w
#define u_offset u_space.xy
#define u_mouse u_space.zw
#define u_cursorPresence u_cursor.x
#define u_cursorEffect u_cursor.y
#define u_cursorStrength u_cursor.z
#define u_cursorRadius u_cursor.w

// Hash compatível com GPUs móveis (evita overflow em precision mediump)
float hash21(vec2 p) {
  p = mod(p, 128.0);
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float grainHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
    mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(17.0, 9.2);
    a *= 0.5;
  }
  return v;
}

vec3 srgbToLinear(vec3 c) {
  return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)),
    step(0.04045, c));
}

vec3 linearToSrgb(vec3 c) {
  return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055,
    step(0.0031308, c));
}

vec3 linToOklab(vec3 c) {
  float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
  float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
  float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;
  l = pow(max(l, 0.0), 1.0 / 3.0);
  m = pow(max(m, 0.0), 1.0 / 3.0);
  s = pow(max(s, 0.0), 1.0 / 3.0);
  return vec3(
    0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s);
}

vec3 oklabToLin(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}

vec3 mixColour(vec3 a, vec3 b, float t) {
  if (u_oklab > 0.5) {
    vec3 la = linToOklab(srgbToLinear(a));
    vec3 lb = linToOklab(srgbToLinear(b));
    return clamp(linearToSrgb(oklabToLin(mix(la, lb, t))), 0.0, 1.0);
  }
  return mix(a, b, t);
}

vec3 palette(float x) {
  float n = max(u_colorCount - 1.0, 1.0);
  float f = clamp(x, 0.0, 1.0) * n;
  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (float(i) < n)
      col = mixColour(col, u_colors[i + 1],
        smoothstep(0.0, 1.0, clamp(f - float(i), 0.0, 1.0)));
  }
  return col;
}

vec3 hueRotate(vec3 col, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                          0.587, -0.274, -0.523,
                          0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0,
                          0.956, -0.272, -1.106,
                          0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * col;
  float ca = cos(a), sa = sin(a);
  yiq = vec3(yiq.x, yiq.y * ca - yiq.z * sa, yiq.y * sa + yiq.z * ca);
  return toRGB * yiq;
}

vec3 shade(vec2 uv, vec2 p, float t) {
  vec2 q = p * 0.32;
  float first = fbm(q - vec2(0.0, t * 0.06) + u_seed);
  float second = fbm(q * 2.0 + vec2(0.0, t * 0.064) - u_seed * 0.17);
  float shape = clamp(0.5 * first + 0.5 * second, 0.0, 1.0);
  float steps = 2.0 + floor(u_intensity * 18.0);
  float stepped = floor(shape * steps) / steps;
  float softened = mix(stepped, shape, u_paramA);
  return palette(softened);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 screenUv = uv;
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy)
    / min(u_resolution.x, u_resolution.y);

  uv = p * min(u_resolution.x, u_resolution.y) / u_resolution.xy + 0.5;
  p *= u_scale;
  if (abs(u_rotate) > 0.0001) {
    float cr = cos(u_rotate), sr = sin(u_rotate);
    p = mat2(cr, -sr, sr, cr) * p;
  }
  p += u_offset;
  if (u_drift > 0.0001)
    p += u_drift * vec2(sin(u_time * 0.31), cos(u_time * 0.23));
  if (u_warp > 0.0) {
    p += u_warp * (vec2(
      fbm(p * u_detail + u_seed),
      fbm(p * u_detail + vec2(5.2, 1.3))) - 0.5);
  }
  vec3 col;
  if (u_blur > 0.0) {
    float e = u_blur;
    float pe = e * u_scale;
    vec2 uvE = vec2(e) * min(u_resolution.x, u_resolution.y) / u_resolution.xy;
    col  = shade(uv, p, u_time) * 0.36;
    col += shade(uv + vec2(uvE.x, 0.0), p + vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv - vec2(uvE.x, 0.0), p - vec2(pe, 0.0), u_time) * 0.16;
    col += shade(uv + vec2(0.0, uvE.y), p + vec2(0.0, pe), u_time) * 0.16;
    col += shade(uv - vec2(0.0, uvE.y), p - vec2(0.0, pe), u_time) * 0.16;
  } else {
    col = shade(uv, p, u_time);
  }
  if (abs(u_contrast - 1.0) > 0.0001)
    col = (col - 0.5) * u_contrast + 0.5;
  if (abs(u_saturation - 1.0) > 0.0001) {
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(luma), col, u_saturation);
  }
  if (abs(u_hue) > 0.0001)
    col = hueRotate(col, u_hue);
  if (abs(u_brightness) > 0.0001)
    col += u_brightness;
  if (u_vignette > 0.0001) {
    float vd = length(screenUv - 0.5) * 1.41421356;
    col *= 1.0 - u_vignette * smoothstep(0.35, 1.0, vd);
  }
  if (u_grain > 0.0001)
    col += (grainHash(
      gl_FragCoord.xy + vec2(u_seed * 17.0, u_seed * 31.0)) - 0.5) * u_grain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`

function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Sem alpha/depth/stencil/antialias: o shader desenha um único triângulo
    // opaco que cobre toda a tela (sem profundidade, stencil ou bordas de
    // polígono visíveis), então esses buffers nunca são usados — desativá-los
    // economiza memória e bytes de banda da GPU sem alterar o resultado.
    const contextAttributes: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    }

    // Suporte amplo a navegadores móveis (iOS Safari / Android Chrome)
    const gl = (canvas.getContext("webgl", contextAttributes) ||
      canvas.getContext("experimental-webgl", contextAttributes)) as WebGLRenderingContext | null
    if (!gl) return

    const compileShader = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vert = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER)
    const frag = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vert || !frag) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vert)
    gl.attachShader(program, frag)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program))
      return
    }

    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    )

    const positionLocation = gl.getAttribLocation(program, "a_position")
    gl.enableVertexAttribArray(positionLocation)
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

    const loc_colors = gl.getUniformLocation(program, "u_colors")
    const loc_scene = gl.getUniformLocation(program, "u_scene")
    const loc_shape = gl.getUniformLocation(program, "u_shape")
    const loc_surface = gl.getUniformLocation(program, "u_surface")
    const loc_finish = gl.getUniformLocation(program, "u_finish")
    const loc_transform = gl.getUniformLocation(program, "u_transform")
    const loc_space = gl.getUniformLocation(program, "u_space")
    const loc_cursor = gl.getUniformLocation(program, "u_cursor")

    const colors = new Float32Array([
      0.063, 0.063, 0.063, // #101010
      0.961, 0.961, 0.961, // #F5F5F5
      0.690, 0.690, 0.690, // #B0B0B0
      0.227, 0.227, 0.227, // #3A3A3A
      0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    ])
    gl.uniform3fv(loc_colors, colors)
    gl.uniform4f(loc_shape, 1.26, 0.35, 0.28, 0.00)
    gl.uniform4f(loc_surface, 1.82, 1.15, -0.01, 0.90)
    gl.uniform4f(loc_finish, 5.48, 0.34, 0.000, 0.04)
    gl.uniform4f(loc_transform, 7439.0, 0.00, 0.03, 1.0)
    // u_space e u_cursor nunca mudam entre frames: setados uma única vez
    // aqui em vez de a cada requestAnimationFrame.
    gl.uniform4f(loc_space, -0.01, 0.17, 0.0, 0.0)
    gl.uniform4f(loc_cursor, 0.0, 0.0, 0.84, 0.36)

    // Tamanho do canvas cacheado via ResizeObserver em vez de
    // getBoundingClientRect() a cada frame (evita forçar layout 60x/s).
    const sizeRef = { width: 0, height: 0 }
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const box = entry.contentBoxSize?.[0]
      if (box) {
        sizeRef.width = box.inlineSize
        sizeRef.height = box.blockSize
      } else {
        sizeRef.width = entry.contentRect.width
        sizeRef.height = entry.contentRect.height
      }
    })
    resizeObserver.observe(canvas)
    const initialRect = canvas.getBoundingClientRect()
    sizeRef.width = initialRect.width
    sizeRef.height = initialRect.height

    // Pausa o desenho quando o canvas sai da viewport (ex.: usuário rola a
    // página além da Hero), economizando GPU/CPU sem afetar o visual.
    let isVisible = true
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry?.isIntersecting ?? true
      },
      { threshold: 0 }
    )
    intersectionObserver.observe(canvas)

    let animationFrameId: number
    const startTime = Date.now()

    const render = () => {
      animationFrameId = requestAnimationFrame(render)

      if (document.hidden || !isVisible) return

      // DPR máximo de 1.5 para garantir performance suave e economizar bateria em celulares
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = Math.floor(sizeRef.width * dpr)
      const height = Math.floor(sizeRef.height * dpr)

      if (width > 0 && height > 0 && (canvas.width !== width || canvas.height !== height)) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, canvas.width, canvas.height)
      }

      const time = (Date.now() - startTime) / 1000

      gl.uniform4f(loc_scene, canvas.width, canvas.height, time * -0.57, 4.0)

      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      gl.deleteProgram(program)
      gl.deleteShader(vert)
      gl.deleteShader(frag)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-10 h-full w-full pointer-events-none"
    />
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden isolate min-h-[calc(100vh-4rem)] flex items-center">
      <ShaderBackground />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-24 w-full">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-sans text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-accent-foreground text-accent-foreground" />
            Avaliação máxima em Petrópolis
          </span>
          <h1 className="mt-6 text-balance font-title text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            A arte do corte masculino, com assinatura de David Rabello
          </h1>
          <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted-foreground">
            Penteados da tendência, barboterapia e estética de alto padrão no tradicional {salon.name}, no
            coração do centro de Petrópolis.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/agendamento"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              <CalendarCheck className="h-4 w-4" />
              Agendar horário
            </Link>
            <Link
              href="/#servicos"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Ver serviços
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            Rua do Imperador, 288 · Loja 14 · Centro
          </div>
        </div>

        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border shadow-sm">
            <HeroCarousel />
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-border bg-card px-5 py-4 shadow-md sm:block">
            <p className="font-title text-2xl font-semibold tracking-tight text-foreground">{salon.rating}</p>
            <p className="font-sans text-xs text-muted-foreground">{salon.reviews} avaliações</p>
          </div>
        </div>
      </div>
    </section>
  )
}
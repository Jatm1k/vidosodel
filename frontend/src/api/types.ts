/** Shapes returned by the backend API (see backend/app/api/serializers.py). */

export type StageState = 'done' | 'partial' | 'empty'
export type JobStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled'

export interface Job {
  id: number
  kind: string
  title: string
  status: JobStatus
  project_id: number | null
  track_id: number | null
  depends_on_id: number | null
  params: Record<string, unknown>
  result: Record<string, unknown>
  progress: number
  message: string
  error: string | null
  created_at: string | null
  started_at: string | null
  finished_at: string | null
  project_name?: string | null
  language?: string | null
}

export interface Language {
  code: string
  name: string
  english: string
  flag: string
}

export interface ImageOperation {
  id: string
  name: string
  short: string
  credits: number
  upscale: boolean
  refs: boolean
  watermark?: string
  note: string
}

export interface Meta {
  languages: Language[]
  effects: { id: string; name: string }[]
  transitions: { id: string; name: string }[]
  image_operations: ImageOperation[]
  defaults: PipelineSettings
  encoders: string[]
  cpu_count: number
}

export interface PipelineSettings {
  voice: { templates: Record<string, string>; default_template_id: string | null; speed: number | null; paragraph_mode: boolean }
  scenes: {
    mode: 'smart' | 'auto'; min_duration: number; max_duration: number
    intro_seconds: number; intro_min_duration: number; intro_max_duration: number
    limit_mode: 'duration' | 'count'; max_images: number
  }
  images: {
    operation: string; model_strategy: 'single' | 'intro' | 'budget'; economy_operation: string
    premium_minutes: number; budget_credits: number
    upscale_2x: boolean; style_prompt: string; avoid: string
    reference_images: string[]; use_references: boolean
    character_refs: boolean; character_operation: string
    watermark_fix: 'auto' | 'inpaint' | 'crop' | 'none'; auto_fix_rejected: boolean; max_attempts: number
  }
  llm: { model: string; niche: string; prompt_instructions: string; temperature: number }
  render: {
    resolution: '1080p' | '1440p' | '2160p'; fps: number; motion_effects: string[]; motion_intensity: number
    transitions: string[]; transition_duration: number; cut_ratio: number; fade_in: number; fade_out: number
    encoder: string; quality: 'max' | 'high' | 'balanced' | 'fast'; workers: number; loudness: number
  }
  subtitles: {
    enabled: boolean; style: 'plain' | 'karaoke' | 'box'; font: string; size: number; bold: boolean
    uppercase: boolean; primary_color: string; highlight_color: string; outline_color: string
    box_color: string; box_opacity: number; outline: number; shadow: number
    position: 'bottom' | 'middle' | 'top'; margin_v: number; max_chars_per_line: number; max_lines: number
  }
  unique: {
    enabled: boolean; strength: number; color_jitter: boolean; film_grain: boolean; vignette: boolean
    micro_zoom: boolean; audio_eq: boolean; strip_metadata: boolean
  }
  publish: {
    enabled: boolean; title_variants: number; tags_count: number; description_footer: string; with_chapters: boolean
    thumbnail_count: number; thumbnail_text: boolean; thumbnail_style: string; thumbnail_operation: string
  }
}

export interface Channel {
  id: number
  name: string
  description: string
  color: string
  settings: Partial<PipelineSettings>
  projects_count: number
  created_at: string
  updated_at: string
}

export interface ChannelDetail extends Channel {
  effective_settings: PipelineSettings
  reference_urls: { path: string; url: string }[]
  projects: ProjectSummary[]
}

export interface ProjectProgress {
  percent: number
  label: string
  videos: number
  running?: boolean
}

export interface ProjectSummary {
  id: number
  channel_id: number
  name: string
  image_mode: 'shared' | 'per_language'
  master_track_id: number | null
  created_at: string
  updated_at: string
  languages: string[]
  cover_url: string | null
  progress: ProjectProgress
}

export interface SceneStats {
  total: number
  prompts: number
  images: number
  failed: number
  generating: number
  shared: number
}

export interface PublishMeta {
  titles?: string[]
  description?: string
  description_full?: string
  tags?: string[]
  chapters?: { t: number; title: string }[]
  thumbnails?: { prompt: string; headline?: string }[]
}

export interface TrackSummary {
  id: number
  project_id: number
  language: string
  language_name: string
  flag: string
  position: number
  is_master: boolean
  shares_images: boolean
  script_chars: number
  script_origin: string
  audio_url: string | null
  audio_duration: number | null
  audio_origin: string | null
  timings_origin: string | null
  srt_url: string | null
  voice_meta: Record<string, any>
  video_url: string | null
  video_meta: Record<string, any>
  video_srt_url: string | null
  preview_url: string | null
  thumbnails: string[]
  publish_meta: PublishMeta
  scene_stats: SceneStats
  stages: Record<'script' | 'voice' | 'timings' | 'scenes' | 'prompts' | 'images' | 'video' | 'publish', StageState>
  active_jobs: Job[]
  failed_jobs: Job[]
  updated_at: string
  script?: string
}

export interface ProjectDetail extends ProjectSummary {
  settings: Partial<PipelineSettings>
  visual_context: string
  characters: Character[]
  tracks: TrackSummary[]
  channel: { id: number; name: string; color: string }
  effective_settings: PipelineSettings
}

export interface Scene {
  id: number
  idx: number
  start: number
  end: number
  text: string
  prompt: string
  prompt_locked: boolean
  image_url: string | null
  image_status: 'none' | 'queued' | 'generating' | 'done' | 'failed'
  image_error: string | null
  image_meta: Record<string, any>
  source_scene_id: number | null
  overrides: { effect?: string; transition?: string; operation?: string }
  /** Ids of project characters in the scene; null – not assigned (names in the prompt are used). */
  characters: number[] | null
  shared: boolean
}

export interface LumeanTemplate {
  id: string
  name: string
  voice_id: string | null
  model_id: string | null
  language_code: string | null
  speed: number | null
}

export interface Voice {
  voice_id: string
  name: string
  description?: string
  gender?: string
  age?: string
  accent?: string
  language?: string
  use_case?: string
  preview_url?: string | null
}

export interface LimiterStatus {
  active: number
  threads: number
  waiting: number
  used: number
  budget: number
  free_in_seconds: number
  /** Epoch seconds when FastGen resets the hourly counter (top of the hour). */
  reset_at: number
}

export interface SystemStatus {
  ffmpeg: string | null
  keys: { lumean: boolean; fastgen: boolean }
  fastgen: LimiterStatus | null
  /** LLM tokens per hour (prompt + completion), shared by every app on the key. */
  llm: Omit<LimiterStatus, 'active' | 'threads'> | null
  data_dir: string
}

export interface AppConfig {
  lumean_api_key: string
  fastgen_api_key: string
  fastgen_credits_per_hour: number
  fastgen_image_threads: number
  fastgen_budget_ratio: number
  fastgen_tokens_per_hour: number
  fastgen_token_ratio: number
  lumean_parallel_orders: number
  parallel_renders: number
}

export interface ImagePlan {
  strategy: 'single' | 'intro' | 'budget'
  budget: number
  hourly_budget: number
  tracks: {
    track_id: number; language: string; scenes: number
    by_operation: Record<string, number>; credits: number; remaining_credits: number
  }[]
  /** scene id → planned operation */
  scene_ops: Record<string, string>
  credits: number
  remaining_credits: number
  hours: number | null
  warning: string | null
}

export interface UpdateInfo {
  current: string
  latest: string | null
  behind: number
  ahead: number
  dirty: boolean
  branch: string | null
  remote: string | null
  notes: { version: string; date: string; body: string }[]
  blocker: string | null
  error: string | null
  available: boolean
  can_apply: boolean
}

export interface VersionState {
  version: string
  /** Started by start.bat/start.sh, which restarts the server after an update. */
  supervised: boolean
  checked_at: number | null
  update: UpdateInfo | null
}

export interface Character {
  id: number
  name: string
  description: string
  position: number
  image_url: string | null
  image_status: 'none' | 'generating' | 'done' | 'failed'
  image_error: string | null
  /** generated | upload */
  image_origin: string | null
}

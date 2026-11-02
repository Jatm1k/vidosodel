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
  dynamic_transitions: { id: string; name: string }[]
  image_operations: ImageOperation[]
  defaults: PipelineSettings
  encoders: string[]
  cpu_count: number
}

export interface PipelineSettings {
  voice: {
    templates: Record<string, string>; default_template_id: string | null; speed: number | null; paragraph_mode: boolean
    /** Language the scripts are written in; null – the first language. */
    master_language: string | null
  }
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
    character_refs: boolean; character_operation: string; scene_continuity: boolean
    watermark_fix: 'auto' | 'inpaint' | 'crop' | 'none'; auto_fix_rejected: boolean; max_attempts: number
  }
  llm: { model: string; packaging_model: string; niche: string; prompt_instructions: string; temperature: number }
  render: {
    resolution: '1080p' | '1440p' | '2160p'; fps: number; motion_effects: string[]; motion_intensity: number
    phrase_cuts: boolean; shot_moves: boolean; depth_of_field: boolean
    transitions: string[]; transition_duration: number; cut_ratio: number;
    dynamic_transitions: boolean; dynamic_ratio: number; fade_in: number; fade_out: number
    encoder: string; quality: 'max' | 'high' | 'balanced' | 'fast'; max_bitrate: number; workers: number; loudness: number
  }
  atmosphere: {
    line_boil: boolean; line_boil_strength: number; grain_boil: boolean; grain_boil_strength: number; boil_hold: number
    breathing: boolean; breathing_strength: number; light_pulse: boolean; light_pulse_strength: number
    vignette_breathing: boolean; vignette_breathing_strength: number; dust: boolean; dust_strength: number
  }
  chapters: {
    enabled: boolean
    style: 'auto' | 'cinema' | 'editorial' | 'brush' | 'minimal' | 'clipping' | 'tape' | 'typewriter' | 'frame' | 'knockout'
    pool: string[]
    kicker: 'word' | 'roman' | 'none'; font: string; color: string; duration: number
  }
  subtitles: {
    enabled: boolean; style: 'plain' | 'karaoke' | 'box'; font: string; size: number; bold: boolean
    uppercase: boolean; primary_color: string; highlight_color: string; outline_color: string
    box_color: string; box_opacity: number; outline: number; shadow: number
    position: 'bottom' | 'middle' | 'top'; margin_v: number; max_chars_per_line: number; max_lines: number
    accents: boolean; accents_per_minute: number; accent_font: string; accent_color: string; accent_styles: string[]
  }
  unique: {
    enabled: boolean; strength: number; color_jitter: boolean; film_grain: boolean; vignette: boolean
    micro_zoom: boolean; audio_eq: boolean; strip_metadata: boolean
  }
  publish: {
    enabled: boolean; title_variants: number; tags_count: number; description_footer: string; with_chapters: boolean
    thumbnail_count: number; thumbnail_spare: number; thumbnail_text: boolean; thumbnail_style: string; thumbnail_operation: string
    thumbnail_text_mode: 'overlay' | 'model'; thumbnail_text_color: string; thumbnail_accent_color: string
  }
  motion: {
    mode: 'off' | 'accents' | 'mixed' | 'full'; overlays_per_minute: number; scene_share: number
    style: string; style_overrides: Record<string, any>; direction: string
    model: string; effort: 'low' | 'medium' | 'high'; parallel: number; chunk_scenes: number; visual_check: boolean
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

/** Board column of a language version (and of a project – by its least advanced language). */
export type ProductionStatus = 'draft' | 'voiced' | 'storyboard' | 'video' | 'ready' | 'published'

export interface TrackStatus {
  id: number
  language: string
  status: ProductionStatus
  running: boolean
  failed: boolean
  has_script: boolean
  published_at: number | null
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
  /** Set for an episode of a series. */
  series_id?: number | null
  episode_number?: number | null
  progress: ProjectProgress
  status: ProductionStatus
  tracks_status: TrackStatus[]
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
  /** Same order as titles: the critic's score (0–10) and the formula of each title. */
  title_info?: { text: string; score: number; formula: string }[]
  description?: string
  description_full?: string
  tags?: string[]
  chapters?: { t: number; title: string }[]
  thumbnails?: { prompt: string; headline?: string; accent?: string; side?: string; score?: number; subject?: string; angle?: string; thought?: string; layout?: string; visual?: number; visual_verdict?: string; visual_note?: string; question?: string; title?: string; title_fixed?: boolean; title_index?: number; image?: string | null }[]
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
  stages: Record<'script' | 'voice' | 'timings' | 'scenes' | 'prompts' | 'images' | 'motion' | 'video' | 'publish', StageState>
  motion: { scenes: number; overlays: number; slots: number; planning: boolean; mode: string | null; stale: boolean }
  status: ProductionStatus
  /** Unix seconds; set by the user. */
  approved_at: number | null
  published_at: number | null
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
  /** The scene continues the previous frame (its image is drawn from it); null – a new frame. */
  continuity: { change: string } | null
  shared: boolean
  /** Id of the motion scene drawn instead of the picture ('' – planned, not written yet). */
  motion?: string | null
}

export interface MotionItem {
  id: string
  kind: 'scene' | 'overlay'
  note: string
  warnings: string[]
  still: string
  slots?: number[]
  start?: number
  end?: number
}

export interface MotionInfo {
  mode: string | null
  style: Record<string, any> | null
  planning: boolean
  stale: boolean
  updated: number | null
  items: MotionItem[]
}

export interface MotionStyles {
  styles: Record<string, { about: string; palette: Record<string, string>; fonts: Record<string, string>; bg: string }>
  families: string[]
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
  keys: { lumean: boolean; fastgen: boolean; gemini?: boolean }
  fastgen: LimiterStatus | null
  /** LLM tokens per hour (prompt + completion), shared by every app on the key. */
  llm: Omit<LimiterStatus, 'active' | 'threads'> | null
  /** Backup LLM (null when not configured); counters since the server started. */
  llm_fallback: { model: string; calls: number; last_at: number | null; last_reason: string | null } | null
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
  cleanup_published_after_days: number
  llm_fallback_enabled: boolean
  llm_fallback_url: string
  llm_fallback_api_key: string
  llm_fallback_model: string
  /** Google AI Studio keys for Gemini TTS (masked when read). */
  gemini_api_keys: string[]
  gemini_tts_model: string
  gemini_tts_daily_limit: number
  youtube_api_key: string
}

export type CleanupKind = 'published_videos' | 'depth' | 'previews' | 'work' | 'orphans'

export interface StorageUsage {
  total: number
  categories: Record<string, { bytes: number; files: number }>
  cleanable: Record<CleanupKind, { bytes: number; files: number }>
  published_versions: number
  auto_days: number
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
  /** generated | upload | series */
  image_origin: string | null
  /** character | location (series episodes) */
  kind?: string
}

// ------------------------------------------------------------------ series
export interface SeriesVoice {
  provider: 'gemini' | 'lumean'
  voice: string
  style: string
  template_id: string
}

export interface SeriesRef {
  id: number
  name: string
  description: string
  position: number
  image_url: string | null
  image_path: string | null
  image_status: 'none' | 'generating' | 'done' | 'failed'
  image_error: string | null
  image_origin: string | null
}

export interface SeriesCharacter extends SeriesRef {
  role: string
  personality: string
  voice: SeriesVoice
}

export interface SeriesOptions {
  narrator_template_id: string
  narrator_speed: number | null
  gap: number
  line_gap: number
  lead_in: number
  tail: number
  music_volume: number
  ambience_volume: number
  sfx_volume: number
  duck_db: number
  line_style: string
  speaker_names_in_subtitles: boolean
}

export interface EpisodeSummary {
  id: number
  series_id: number
  number: number | null
  title: string
  synopsis: string
  summary: string
  track_id: number
  blocks: number
  voiced: number
  to_voice: number
  cues: number
  cues_ready: number
  assembled: boolean
  duration: number | null
  scenes: number
  images: number
  video_url: string | null
  updated_at: string
}

export interface SeriesSummary {
  id: number
  channel_id: number
  name: string
  language: string
  logline: string
  updated_at: string
  episodes_count: number
  cover_url: string | null
}

export interface SeriesDetail extends SeriesSummary {
  setting: string
  bible: string
  visual_style: string
  options: SeriesOptions
  narrator_template_id: string | null
  characters: SeriesCharacter[]
  locations: SeriesRef[]
  episodes: EpisodeSummary[]
}

export type BlockKind = 'narration' | 'line' | 'pause'
export type MediaStatus = 'none' | 'queued' | 'generating' | 'done' | 'failed'

export interface EpisodeBlock {
  id: number
  position: number
  kind: BlockKind
  character_id: number | null
  character: string | null
  text: string
  direction: string
  location_id: number | null
  location: string | null
  visible: string[]
  gap_after: number | null
  pause: number
  shots: number | null
  visual: string
  audio_url: string | null
  audio_duration: number | null
  audio_status: MediaStatus
  audio_error: string | null
  audio_stale: boolean
  audio_provider: string | null
  audio_warning: string | null
  start: number | null
  end: number | null
}

export type CueKind = 'music' | 'ambience' | 'sfx'

export interface SoundCue {
  id: number
  kind: CueKind
  prompt: string
  start_block_id: number | null
  anchor: 'start' | 'end'
  offset: number
  end_block_id: number | null
  duration: number | null
  volume: number
  fade_in: number
  fade_out: number
  audio_url: string | null
  audio_duration: number | null
  audio_status: MediaStatus
  audio_error: string | null
  window: [number, number] | null
}

export interface EpisodeDetail extends Omit<EpisodeSummary, 'blocks' | 'cues'> {
  blocks: EpisodeBlock[]
  cues: SoundCue[]
  estimated_duration: number
  timeline_estimated: boolean
  audio_url: string | null
  jobs: { id: number; kind: string; title: string; status: string; progress: number; message: string }[]
}

export interface GeminiStatus {
  day: string
  limit: number
  keys: { key: string; id: string; used: number; left: number; exhausted: boolean }[]
  left: number
  resets_at: number
  model: string | null
}

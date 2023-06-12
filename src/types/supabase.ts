export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      episodes: {
        Row: {
          created_at: string | null
          episode: number | null
          id: number
          season_id: number
          title: string
          video_id: number
        }
        Insert: {
          created_at?: string | null
          episode?: number | null
          id?: number
          season_id: number
          title: string
          video_id: number
        }
        Update: {
          created_at?: string | null
          episode?: number | null
          id?: number
          season_id?: number
          title?: string
          video_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episodes_video_id_fkey"
            columns: ["video_id"]
            referencedRelation: "videos"
            referencedColumns: ["id"]
          }
        ]
      }
      history: {
        Row: {
          created_at: string
          id: number
          time: number | null
          updated_at: string
          user_id: string
          video_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          time?: number | null
          updated_at?: string
          user_id?: string
          video_id: number
        }
        Update: {
          created_at?: string
          id?: number
          time?: number | null
          updated_at?: string
          user_id?: string
          video_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "history_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "history_video_id_fkey"
            columns: ["video_id"]
            referencedRelation: "videos"
            referencedColumns: ["id"]
          }
        ]
      }
      movies: {
        Row: {
          created_at: string | null
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: number
          title: string
          updated_at: string | null
          updated_by: string | null
          video_id: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          title: string
          updated_at?: string | null
          updated_by?: string | null
          video_id: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: number
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          video_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "movies_video_id_fkey"
            columns: ["video_id"]
            referencedRelation: "videos"
            referencedColumns: ["id"]
          }
        ]
      }
      seasons: {
        Row: {
          created_at: string | null
          id: number
          poster: string | null
          series_id: number | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          poster?: string | null
          series_id?: number | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          poster?: string | null
          series_id?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_series_id_fkey"
            columns: ["series_id"]
            referencedRelation: "series"
            referencedColumns: ["id"]
          }
        ]
      }
      series: {
        Row: {
          created_at: string | null
          id: number
          poster: string | null
          title: string
          tmdb_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          poster?: string | null
          title: string
          tmdb_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          poster?: string | null
          title?: string
          tmdb_id?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          created_at: string | null
          end_at: number | null
          id: number
          start_at: number | null
          ytid: string
        }
        Insert: {
          created_at?: string | null
          end_at?: number | null
          id?: number
          start_at?: number | null
          ytid: string
        }
        Update: {
          created_at?: string | null
          end_at?: number | null
          id?: number
          start_at?: number | null
          ytid?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

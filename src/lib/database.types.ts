/**
 * Tipos do banco (espelho de supabase/migrations). Escrito à mão: ao mudar o
 * schema, atualize aqui também.
 */
import type { Contexto } from "@/lib/glucose/ranges";

type Timestamps = { criado_em: string; atualizado_em: string };

type Table<Row, Required extends keyof Row, Optional extends keyof Row = never> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Pick<Row, Optional>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type GlucoseReading = {
  id: string;
  user_id: string;
  valor_mg_dl: number;
  contexto: Contexto;
  medido_em: string;
  observacao: string | null;
  meal_id: string | null;
} & Timestamps;

export type Meal = {
  id: string;
  user_id: string;
  descricao: string;
  ocorreu_em: string;
} & Timestamps;

export type Activity = {
  id: string;
  user_id: string;
  tipo: string;
  duracao_min: number;
  ocorreu_em: string;
} & Timestamps;

export type Weight = {
  id: string;
  user_id: string;
  peso_kg: number;
  medido_em: string;
} & Timestamps;

export type TargetRange = {
  id: string;
  user_id: string;
  contexto: Contexto;
  normal_min: number;
  normal_max: number;
  atencao_max: number;
  atualizado_em: string;
};

export type Profile = {
  id: string;
  nome: string | null;
  aviso_aceito_em: string | null;
  criado_em: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile, "id", "nome" | "aviso_aceito_em">;
      glucose_readings: Table<
        GlucoseReading,
        "valor_mg_dl" | "contexto" | "medido_em",
        "id" | "observacao" | "meal_id"
      >;
      meals: Table<Meal, "descricao" | "ocorreu_em", "id">;
      activities: Table<Activity, "tipo" | "duracao_min" | "ocorreu_em", "id">;
      weights: Table<Weight, "peso_kg" | "medido_em", "id">;
      target_ranges: Table<
        TargetRange,
        "contexto" | "normal_min" | "normal_max" | "atencao_max",
        "id"
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
    };
    Enums: { contexto_medicao: Contexto };
    CompositeTypes: { [_ in never]: never };
  };
};

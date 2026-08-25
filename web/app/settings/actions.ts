"use server";
import { db, schema } from "@pe/shared";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addGeography(formData: FormData) {
  const city = String(formData.get("city") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim();
  if (!city || !country) return;
  await db
    .insert(schema.geographies)
    .values({
      city,
      country,
      radiusKm: Number(formData.get("radiusKm") ?? 50),
      lumaSlug: String(formData.get("lumaSlug") ?? "").trim() || null,
      enabled: true,
    })
    .onConflictDoNothing({ target: [schema.geographies.city, schema.geographies.country] });
  revalidatePath("/settings");
}

export async function toggleGeography(id: number, enabled: boolean) {
  await db.update(schema.geographies).set({ enabled }).where(eq(schema.geographies.id, id));
  revalidatePath("/settings");
}

export async function deleteGeography(id: number) {
  await db.delete(schema.geographies).where(eq(schema.geographies.id, id));
  revalidatePath("/settings");
}

export async function toggleSource(key: string, enabled: boolean) {
  await db.update(schema.sources).set({ enabled }).where(eq(schema.sources.key, key));
  revalidatePath("/settings");
}

export async function updateSetting(key: string, value: string) {
  await db
    .insert(schema.settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedAt: sql`now()` } });
  revalidatePath("/settings");
}

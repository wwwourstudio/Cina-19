import { and, desc, eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from './index.ts';
import {
  chatMessages,
  chatThreads,
  scoutReports,
  studioAssets,
  studioProjects,
  users,
} from './schema.ts';

// In-memory fallback store used when Cloud SQL is not provisioned
let nextId = 1;
const memUsers = new Map<string, typeof users.$inferSelect>();
const memProjects = new Map<number, typeof studioProjects.$inferSelect>();
const memAssets = new Map<number, typeof studioAssets.$inferSelect>();
const memThreads = new Map<number, typeof chatThreads.$inferSelect>();
const memMessages = new Map<number, typeof chatMessages.$inferSelect>();
const memScouts = new Map<number, typeof scoutReports.$inferSelect>();

function useLiveDb(): boolean {
  return Boolean(isDatabaseConfigured && db);
}

export async function syncOrFetchUser(params: {
  uid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
}) {
  const safeEmail = params.email || `${params.uid}@cina.studio`;
  const defaultName =
    params.displayName?.trim() || safeEmail.split('@')[0] || 'Director';
  const handleBase = defaultName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 18) || 'director';

  if (!useLiveDb()) {
    const existing = memUsers.get(params.uid);
    const record: typeof users.$inferSelect = {
      id: existing?.id ?? nextId++,
      uid: params.uid,
      email: safeEmail,
      displayName: defaultName,
      photoUrl: params.photoUrl || '',
      studioHandle: existing?.studioHandle ?? `@${handleBase}`,
      createdAt: existing?.createdAt ?? new Date(),
    };
    memUsers.set(params.uid, record);
    return record;
  }

  try {
    const rows = await db
      .insert(users)
      .values({
        uid: params.uid,
        email: safeEmail,
        displayName: defaultName,
        photoUrl: params.photoUrl || '',
        studioHandle: `@${handleBase}`,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: safeEmail,
          displayName: defaultName,
          photoUrl: params.photoUrl || '',
        },
      })
      .returning();

    return rows[0];
  } catch (error) {
    console.warn('Falling back to in-memory user store:', error);
    const existing = memUsers.get(params.uid);
    const record: typeof users.$inferSelect = {
      id: existing?.id ?? nextId++,
      uid: params.uid,
      email: safeEmail,
      displayName: defaultName,
      photoUrl: params.photoUrl || '',
      studioHandle: existing?.studioHandle ?? `@${handleBase}`,
      createdAt: existing?.createdAt ?? new Date(),
    };
    memUsers.set(params.uid, record);
    return record;
  }
}

export async function listUserProjects(uid: string) {
  const listMem = () => {
    const existing = Array.from(memProjects.values())
      .filter((p) => p.userUid === uid)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    if (existing.length > 0) return existing;
    const now = new Date();
    const seeded: typeof studioProjects.$inferSelect = {
      id: nextId++,
      userUid: uid,
      title: 'Nocturne in Marseille',
      logline:
        'At an overnight Mediterranean port terminal, an archival sound recordist uncovers a frequency linking two estranged timelines.',
      genre: 'Neo-Noir · Arthouse',
      aspectRatio: '16:9',
      status: 'in_production',
      createdAt: now,
      updatedAt: now,
    };
    memProjects.set(seeded.id, seeded);
    return [seeded];
  };

  if (!useLiveDb()) {
    return listMem();
  }

  try {
    const existing = await db
      .select()
      .from(studioProjects)
      .where(eq(studioProjects.userUid, uid))
      .orderBy(desc(studioProjects.updatedAt));

    if (existing.length > 0) {
      return existing;
    }

    // Seed a starter production slate for newly signed-in directors
    const seeded = await db
      .insert(studioProjects)
      .values({
        userUid: uid,
        title: 'Nocturne in Marseille',
        logline:
          'At an overnight Mediterranean port terminal, an archival sound recordist uncovers a frequency linking two estranged timelines.',
        genre: 'Neo-Noir · Arthouse',
        aspectRatio: '16:9',
        status: 'in_production',
      })
      .returning();

    return seeded;
  } catch (error) {
    console.warn('Falling back to in-memory projects:', error);
    return listMem();
  }
}

export async function createUserProject(params: {
  uid: string;
  title: string;
  logline: string;
  genre: string;
  aspectRatio: string;
}) {
  const createMem = () => {
    const now = new Date();
    const project: typeof studioProjects.$inferSelect = {
      id: nextId++,
      userUid: params.uid,
      title: params.title.trim().slice(0, 160),
      logline: params.logline.trim().slice(0, 1000),
      genre: params.genre.trim().slice(0, 80) || 'Cinema',
      aspectRatio: params.aspectRatio === '9:16' ? '9:16' : '16:9',
      status: 'in_production',
      createdAt: now,
      updatedAt: now,
    };
    memProjects.set(project.id, project);
    return project;
  };

  if (!useLiveDb()) {
    return createMem();
  }

  try {
    const rows = await db
      .insert(studioProjects)
      .values({
        userUid: params.uid,
        title: params.title.trim().slice(0, 160),
        logline: params.logline.trim().slice(0, 1000),
        genre: params.genre.trim().slice(0, 80) || 'Cinema',
        aspectRatio: params.aspectRatio === '9:16' ? '9:16' : '16:9',
        status: 'in_production',
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.warn('Falling back to in-memory project creation:', error);
    return createMem();
  }
}

export async function deleteUserProject(uid: string, projectId: number) {
  const existing = memProjects.get(projectId);
  if (existing && existing.userUid === uid) {
    memProjects.delete(projectId);
  }
  if (!useLiveDb()) return;

  try {
    await db
      .delete(studioProjects)
      .where(and(eq(studioProjects.id, projectId), eq(studioProjects.userUid, uid)));
  } catch (error) {
    console.warn('Non-fatal project delete warning:', error);
  }
}

export async function listUserAssets(uid: string, projectId?: number | null) {
  const listMem = () =>
    Array.from(memAssets.values())
      .filter((a) => a.userUid === uid && (!projectId || a.projectId === projectId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 40);

  if (!useLiveDb()) {
    return listMem();
  }

  try {
    if (projectId) {
      return await db
        .select()
        .from(studioAssets)
        .where(and(eq(studioAssets.userUid, uid), eq(studioAssets.projectId, projectId)))
        .orderBy(desc(studioAssets.createdAt))
        .limit(40);
    }
    return await db
      .select()
      .from(studioAssets)
      .where(eq(studioAssets.userUid, uid))
      .orderBy(desc(studioAssets.createdAt))
      .limit(40);
  } catch (error) {
    console.warn('Falling back to in-memory assets:', error);
    return listMem();
  }
}

export async function saveUserAsset(params: {
  uid: string;
  projectId?: number | null;
  kind: 'image' | 'video' | 'music' | 'transcript';
  title: string;
  prompt: string;
  modelUsed: string;
  mediaDataUrl?: string;
  textBody?: string;
  interactionId?: string;
  aspectRatio?: string;
}) {
  const saveMem = () => {
    const asset: typeof studioAssets.$inferSelect = {
      id: nextId++,
      userUid: params.uid,
      projectId: params.projectId ?? null,
      kind: params.kind,
      title: params.title.trim().slice(0, 200) || 'Untitled Take',
      prompt: params.prompt.slice(0, 4000),
      modelUsed: params.modelUsed,
      mediaDataUrl: params.mediaDataUrl || '',
      textBody: params.textBody || '',
      interactionId: params.interactionId || '',
      aspectRatio: params.aspectRatio || '16:9',
      createdAt: new Date(),
    };
    memAssets.set(asset.id, asset);
    return asset;
  };

  if (!useLiveDb()) {
    return saveMem();
  }

  try {
    const rows = await db
      .insert(studioAssets)
      .values({
        userUid: params.uid,
        projectId: params.projectId ?? null,
        kind: params.kind,
        title: params.title.trim().slice(0, 200) || 'Untitled Take',
        prompt: params.prompt.slice(0, 4000),
        modelUsed: params.modelUsed,
        mediaDataUrl: params.mediaDataUrl || '',
        textBody: params.textBody || '',
        interactionId: params.interactionId || '',
        aspectRatio: params.aspectRatio || '16:9',
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.warn('Falling back to in-memory asset save:', error);
    return saveMem();
  }
}

export async function deleteUserAsset(uid: string, assetId: number) {
  const existing = memAssets.get(assetId);
  if (existing && existing.userUid === uid) {
    memAssets.delete(assetId);
  }
  if (!useLiveDb()) return;

  try {
    await db
      .delete(studioAssets)
      .where(and(eq(studioAssets.id, assetId), eq(studioAssets.userUid, uid)));
  } catch (error) {
    console.warn('Non-fatal asset delete warning:', error);
  }
}

export async function listUserThreads(uid: string) {
  const listMem = () =>
    Array.from(memThreads.values())
      .filter((t) => t.userUid === uid)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 25);

  if (!useLiveDb()) {
    return listMem();
  }

  try {
    return await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.userUid, uid))
      .orderBy(desc(chatThreads.updatedAt))
      .limit(25);
  } catch (error) {
    console.warn('Falling back to in-memory threads:', error);
    return listMem();
  }
}

export async function getThreadMessages(uid: string, threadId: number) {
  const listMem = () =>
    Array.from(memMessages.values())
      .filter((m) => m.threadId === threadId && m.userUid === uid)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (!useLiveDb()) {
    return listMem();
  }

  try {
    return await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.threadId, threadId), eq(chatMessages.userUid, uid)))
      .orderBy(chatMessages.createdAt);
  } catch (error) {
    console.warn('Falling back to in-memory thread messages:', error);
    return listMem();
  }
}

export async function createOrAppendChatTurn(params: {
  uid: string;
  threadId?: number | null;
  projectId?: number | null;
  persona: string;
  modelTier: string;
  userText: string;
  modelText: string;
}) {
  const saveMem = () => {
    const now = new Date();
    let activeThreadId = params.threadId ?? null;
    if (!activeThreadId || !memThreads.has(activeThreadId)) {
      const thread: typeof chatThreads.$inferSelect = {
        id: nextId++,
        userUid: params.uid,
        projectId: params.projectId ?? null,
        title: params.userText.trim().slice(0, 72) || 'Director Session',
        persona: params.persona,
        modelTier: params.modelTier,
        createdAt: now,
        updatedAt: now,
      };
      memThreads.set(thread.id, thread);
      activeThreadId = thread.id;
    } else {
      const existing = memThreads.get(activeThreadId)!;
      memThreads.set(activeThreadId, {
        ...existing,
        updatedAt: now,
        modelTier: params.modelTier,
        persona: params.persona,
      });
    }
    const uMsg: typeof chatMessages.$inferSelect = {
      id: nextId++,
      threadId: activeThreadId,
      userUid: params.uid,
      role: 'user',
      content: params.userText,
      modelUsed: params.modelTier,
      createdAt: now,
    };
    const mMsg: typeof chatMessages.$inferSelect = {
      id: nextId++,
      threadId: activeThreadId,
      userUid: params.uid,
      role: 'model',
      content: params.modelText,
      modelUsed: params.modelTier,
      createdAt: new Date(now.getTime() + 1),
    };
    memMessages.set(uMsg.id, uMsg);
    memMessages.set(mMsg.id, mMsg);
    return activeThreadId;
  };

  if (!useLiveDb()) {
    return saveMem();
  }

  try {
    let activeThreadId = params.threadId ?? null;
    if (!activeThreadId) {
      const created = await db
        .insert(chatThreads)
        .values({
          userUid: params.uid,
          projectId: params.projectId ?? null,
          title: params.userText.trim().slice(0, 72) || 'Director Session',
          persona: params.persona,
          modelTier: params.modelTier,
        })
        .returning();
      activeThreadId = created[0].id;
    } else {
      await db
        .update(chatThreads)
        .set({ updatedAt: new Date(), modelTier: params.modelTier, persona: params.persona })
        .where(and(eq(chatThreads.id, activeThreadId), eq(chatThreads.userUid, params.uid)));
    }

    await db.insert(chatMessages).values([
      {
        threadId: activeThreadId,
        userUid: params.uid,
        role: 'user',
        content: params.userText,
        modelUsed: params.modelTier,
      },
      {
        threadId: activeThreadId,
        userUid: params.uid,
        role: 'model',
        content: params.modelText,
        modelUsed: params.modelTier,
      },
    ]);

    return activeThreadId;
  } catch (error) {
    console.warn('Falling back to in-memory chat turn persistence:', error);
    return saveMem();
  }
}

export async function listUserScoutReports(uid: string) {
  const listMem = () =>
    Array.from(memScouts.values())
      .filter((s) => s.userUid === uid)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20);

  if (!useLiveDb()) {
    return listMem();
  }

  try {
    return await db
      .select()
      .from(scoutReports)
      .where(eq(scoutReports.userUid, uid))
      .orderBy(desc(scoutReports.createdAt))
      .limit(20);
  } catch (error) {
    console.warn('Falling back to in-memory scout reports:', error);
    return listMem();
  }
}

export async function saveScoutReport(params: {
  uid: string;
  projectId?: number | null;
  mode: 'search' | 'maps';
  query: string;
  summary: string;
  sourcesJson: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const saveMem = () => {
    const report: typeof scoutReports.$inferSelect = {
      id: nextId++,
      userUid: params.uid,
      projectId: params.projectId ?? null,
      mode: params.mode,
      query: params.query.slice(0, 600),
      summary: params.summary,
      sourcesJson: params.sourcesJson,
      latitude: params.latitude ?? null,
      longitude: params.longitude ?? null,
      createdAt: new Date(),
    };
    memScouts.set(report.id, report);
    return report;
  };

  if (!useLiveDb()) {
    return saveMem();
  }

  try {
    const rows = await db
      .insert(scoutReports)
      .values({
        userUid: params.uid,
        projectId: params.projectId ?? null,
        mode: params.mode,
        query: params.query.slice(0, 600),
        summary: params.summary,
        sourcesJson: params.sourcesJson,
        latitude: params.latitude ?? null,
        longitude: params.longitude ?? null,
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.warn('Falling back to in-memory scout save:', error);
    return saveMem();
  }
}

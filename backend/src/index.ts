import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
// @ts-ignore
import { PrismaClient } from "./generated/client";

dotenv.config();

// Ensure DATABASE_URL is absolute to avoid relative path issues with generated client
const dbPath = path.resolve(__dirname, "../dev.db");
process.env.DATABASE_URL = `file:${dbPath}`;
console.log("Resolved DATABASE_URL:", process.env.DATABASE_URL);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// --- Drawings ---

// GET /drawings
app.get("/drawings", async (req, res) => {
  try {
    const { search, collectionId } = req.query;
    const where: any = {};

    if (search) {
      where.name = { contains: String(search) };
    }

    if (collectionId === "null") {
      where.collectionId = null;
    } else if (collectionId) {
      where.collectionId = String(collectionId);
    }

    const drawings = await prisma.drawing.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    // Parse JSON strings for response
    const parsedDrawings = drawings.map((d: any) => ({
      ...d,
      elements: JSON.parse(d.elements),
      appState: JSON.parse(d.appState),
    }));

    res.json(parsedDrawings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch drawings" });
  }
});

// GET /drawings/:id
app.get("/drawings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const drawing = await prisma.drawing.findUnique({ where: { id } });

    if (!drawing) {
      return res.status(404).json({ error: "Drawing not found" });
    }

    res.json({
      ...drawing,
      elements: JSON.parse(drawing.elements),
      appState: JSON.parse(drawing.appState),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch drawing" });
  }
});

// POST /drawings
app.post("/drawings", async (req, res) => {
  try {
    const { name, elements, appState, collectionId } = req.body;

    const newDrawing = await prisma.drawing.create({
      data: {
        name,
        elements: JSON.stringify(elements || []),
        appState: JSON.stringify(appState || {}),
        collectionId: collectionId || null,
      },
    });

    res.json({
      ...newDrawing,
      elements: JSON.parse(newDrawing.elements),
      appState: JSON.parse(newDrawing.appState),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create drawing" });
  }
});

// PUT /drawings/:id
app.put("/drawings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, elements, appState, collectionId } = req.body;

    const data: any = {
      version: { increment: 1 },
    };

    if (name !== undefined) data.name = name;
    if (elements !== undefined) data.elements = JSON.stringify(elements);
    if (appState !== undefined) data.appState = JSON.stringify(appState);
    if (collectionId !== undefined) data.collectionId = collectionId;

    const updatedDrawing = await prisma.drawing.update({
      where: { id },
      data,
    });

    res.json({
      ...updatedDrawing,
      elements: JSON.parse(updatedDrawing.elements),
      appState: JSON.parse(updatedDrawing.appState),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update drawing" });
  }
});

// DELETE /drawings/:id
app.delete("/drawings/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.drawing.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete drawing" });
  }
});

// POST /drawings/:id/duplicate
app.post("/drawings/:id/duplicate", async (req, res) => {
  try {
    const { id } = req.params;
    const original = await prisma.drawing.findUnique({ where: { id } });

    if (!original) {
      return res.status(404).json({ error: "Original drawing not found" });
    }

    const newDrawing = await prisma.drawing.create({
      data: {
        name: `${original.name} (Copy)`,
        elements: original.elements,
        appState: original.appState,
        collectionId: original.collectionId,
        version: 1,
      },
    });

    res.json({
      ...newDrawing,
      elements: JSON.parse(newDrawing.elements),
      appState: JSON.parse(newDrawing.appState),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to duplicate drawing" });
  }
});

// --- Collections ---

// GET /collections
app.get("/collections", async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(collections);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

// POST /collections
app.post("/collections", async (req, res) => {
  try {
    const { name } = req.body;
    const newCollection = await prisma.collection.create({
      data: { name },
    });
    res.json(newCollection);
  } catch (error) {
    res.status(500).json({ error: "Failed to create collection" });
  }
});

// PUT /collections/:id
app.put("/collections/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const updatedCollection = await prisma.collection.update({
      where: { id },
      data: { name },
    });
    res.json(updatedCollection);
  } catch (error) {
    res.status(500).json({ error: "Failed to update collection" });
  }
});

// DELETE /collections/:id
app.delete("/collections/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Transaction: Unlink drawings, then delete collection
    await prisma.$transaction([
      prisma.drawing.updateMany({
        where: { collectionId: id },
        data: { collectionId: null },
      }),
      prisma.collection.delete({
        where: { id },
      }),
    ]);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete collection" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

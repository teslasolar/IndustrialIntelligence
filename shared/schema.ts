import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const directories = pgTable("directories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull().unique(),
  parentId: integer("parent_id"),
  fileCount: integer("file_count").default(0),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull().unique(),
  directoryId: integer("directory_id").notNull(),
  size: integer("size").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("sync"),
  checksum: text("checksum"),
  lastModified: timestamp("last_modified").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const fileOperations = pgTable("file_operations", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // COPY_FILE, VALIDATE_PERM, BACKUP_DIR, etc.
  target: text("target").notNull(),
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  progress: integer("progress").default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const systemAlarms = pgTable("system_alarms", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // FILE_CONFLICT, HIGH_MEM_USAGE, SYNC_TIMEOUT
  message: text("message").notNull(),
  location: text("location"),
  severity: text("severity").notNull().default("warning"), // info, warning, error, critical
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemMetrics = pgTable("system_metrics", {
  id: serial("id").primaryKey(),
  cpuUsage: integer("cpu_usage").notNull(),
  memoryUsage: integer("memory_usage").notNull(),
  diskIO: integer("disk_io").notNull(),
  throughput: integer("throughput").notNull(), // in KB/s
  operationsPerMin: integer("operations_per_min").notNull(),
  errorRate: integer("error_rate").notNull(), // percentage * 100
  timestamp: timestamp("timestamp").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDirectorySchema = createInsertSchema(directories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
});

export const insertFileOperationSchema = createInsertSchema(fileOperations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemAlarmSchema = createInsertSchema(systemAlarms).omit({
  id: true,
  createdAt: true,
});

export const insertSystemMetricsSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Directory = typeof directories.$inferSelect;
export type InsertDirectory = z.infer<typeof insertDirectorySchema>;

export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type FileOperation = typeof fileOperations.$inferSelect;
export type InsertFileOperation = z.infer<typeof insertFileOperationSchema>;

export type SystemAlarm = typeof systemAlarms.$inferSelect;
export type InsertSystemAlarm = z.infer<typeof insertSystemAlarmSchema>;

export type SystemMetrics = typeof systemMetrics.$inferSelect;
export type InsertSystemMetrics = z.infer<typeof insertSystemMetricsSchema>;

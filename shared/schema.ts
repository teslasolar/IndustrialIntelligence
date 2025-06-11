import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// UNS Tag Structure - Unified Namespace for Industrial IoT
export const unsNodes = pgTable("uns_nodes", {
  id: serial("id").primaryKey(),
  nodeId: text("node_id").notNull().unique(), // e.g., "Enterprise/Site/Area/Line/Cell/Device"
  parentNodeId: text("parent_node_id"),
  name: text("name").notNull(),
  nodeType: text("node_type").notNull(), // Enterprise, Site, Area, Line, Cell, Device, Component
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const unsTags = pgTable("uns_tags", {
  id: serial("id").primaryKey(),
  tagPath: text("tag_path").notNull().unique(), // Full UNS path like "Enterprise/Site1/Area1/PLC1/FileSystem/Status"
  nodeId: text("node_id").notNull(), // Reference to UNS node
  tagName: text("tag_name").notNull(),
  dataType: text("data_type").notNull(), // String, Int32, Float32, Boolean, DateTime, JSON
  value: text("value"), // Stored as text, parsed based on dataType
  quality: text("quality").notNull().default("Good"), // Good, Bad, Uncertain
  timestamp: timestamp("timestamp").defaultNow(),
  historize: boolean("historize").default(false),
  metadata: jsonb("metadata"),
});

// Perspective Views - JSON view definitions
export const perspectiveViews = pgTable("perspective_views", {
  id: serial("id").primaryKey(),
  viewPath: text("view_path").notNull().unique(), // e.g., "FileSystem/HMI/DirectoryBrowser"
  viewName: text("view_name").notNull(),
  viewType: text("view_type").notNull(), // Page, Container, Popup, Template
  viewDefinition: jsonb("view_definition").notNull(), // Full Perspective JSON definition
  parentPath: text("parent_path"),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tag Groups for organizing related tags
export const tagGroups = pgTable("tag_groups", {
  id: serial("id").primaryKey(),
  groupPath: text("group_path").notNull().unique(),
  groupName: text("group_name").notNull(),
  parentGroupPath: text("parent_group_path"),
  description: text("description"),
  scanClass: text("scan_class").default("Default"), // Direct, Default, Historical, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Historical data for tag values
export const tagHistory = pgTable("tag_history", {
  id: serial("id").primaryKey(),
  tagPath: text("tag_path").notNull(),
  value: text("value").notNull(),
  quality: text("quality").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

// Alarms based on tag conditions
export const tagAlarms = pgTable("tag_alarms", {
  id: serial("id").primaryKey(),
  alarmPath: text("alarm_path").notNull().unique(),
  tagPath: text("tag_path").notNull(),
  alarmType: text("alarm_type").notNull(), // AnalogHiHi, AnalogHi, AnalogLo, AnalogLoLo, Digital, Deadband
  condition: text("condition").notNull(), // JSON condition definition
  priority: integer("priority").default(500), // 0-999, higher is more critical
  isActive: boolean("is_active").default(false),
  isAcknowledged: boolean("is_acknowledged").default(false),
  message: text("message").notNull(),
  activeTime: timestamp("active_time"),
  ackTime: timestamp("ack_time"),
  clearedTime: timestamp("cleared_time"),
  metadata: jsonb("metadata"),
});

// System configuration for SCADA
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  configPath: text("config_path").notNull().unique(),
  configValue: text("config_value").notNull(),
  dataType: text("data_type").notNull(),
  description: text("description"),
  isReadOnly: boolean("is_read_only").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUnsNodeSchema = createInsertSchema(unsNodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUnsTagSchema = createInsertSchema(unsTags).omit({
  id: true,
  timestamp: true,
});

export const insertPerspectiveViewSchema = createInsertSchema(perspectiveViews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTagGroupSchema = createInsertSchema(tagGroups).omit({
  id: true,
  createdAt: true,
});

export const insertTagHistorySchema = createInsertSchema(tagHistory).omit({
  id: true,
});

export const insertTagAlarmSchema = createInsertSchema(tagAlarms).omit({
  id: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UnsNode = typeof unsNodes.$inferSelect;
export type InsertUnsNode = z.infer<typeof insertUnsNodeSchema>;

export type UnsTag = typeof unsTags.$inferSelect;
export type InsertUnsTag = z.infer<typeof insertUnsTagSchema>;

export type PerspectiveView = typeof perspectiveViews.$inferSelect;
export type InsertPerspectiveView = z.infer<typeof insertPerspectiveViewSchema>;

export type TagGroup = typeof tagGroups.$inferSelect;
export type InsertTagGroup = z.infer<typeof insertTagGroupSchema>;

export type TagHistory = typeof tagHistory.$inferSelect;
export type InsertTagHistory = z.infer<typeof insertTagHistorySchema>;

export type TagAlarm = typeof tagAlarms.$inferSelect;
export type InsertTagAlarm = z.infer<typeof insertTagAlarmSchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

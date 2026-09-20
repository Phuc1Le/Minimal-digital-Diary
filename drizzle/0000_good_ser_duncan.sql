CREATE TABLE `entry` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_time` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`category` text NOT NULL,
	`content` text
);
--> statement-breakpoint
CREATE INDEX `entry_time_index` ON `entry` (`entry_time`);--> statement-breakpoint
CREATE INDEX `entry_category_index` ON `entry` (`category`);--> statement-breakpoint
CREATE TABLE `photos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entry_id` integer NOT NULL,
	`file_path` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `photos_entry_id_index` ON `photos` (`entry_id`);
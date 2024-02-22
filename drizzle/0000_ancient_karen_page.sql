CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`osu_id` integer,
	`osu_username` text,
	`verify_time` integer NOT NULL,
	`verify_method` text NOT NULL,
	`verify_data` text
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`osu_id` integer NOT NULL,
	`code` text NOT NULL,
	`time` integer NOT NULL
);

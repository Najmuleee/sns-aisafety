CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`user_id` integer,
	`upload_id` integer,
	`metadata` text,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `consent_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`upload_id` integer NOT NULL,
	`requested_from_user_id` integer NOT NULL,
	`detected_face_id` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer,
	`responded_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `detected_faces` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`upload_id` integer NOT NULL,
	`matched_user_id` integer,
	`embedding_vector` text NOT NULL,
	`bounding_box` text NOT NULL,
	`confidence` text NOT NULL,
	`is_uploader` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `face_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`embedding_vector` text NOT NULL,
	`original_image_path` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`uploader_id` integer NOT NULL,
	`original_image_path` text NOT NULL,
	`final_image_path` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`caption` text,
	`consent_status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`lastSignedIn` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);
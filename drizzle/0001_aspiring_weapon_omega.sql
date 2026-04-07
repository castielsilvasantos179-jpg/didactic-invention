CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`key` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiKeys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `clicks` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`linkId` int NOT NULL,
	`userId` int NOT NULL,
	`userAgent` text,
	`ipAddress` varchar(45),
	`referrer` text,
	`country` varchar(2),
	`countryName` varchar(100),
	`city` varchar(100),
	`latitude` varchar(20),
	`longitude` varchar(20),
	`deviceType` enum('mobile','tablet','desktop','unknown') NOT NULL DEFAULT 'unknown',
	`browser` varchar(100),
	`os` varchar(100),
	`isBot` boolean NOT NULL DEFAULT false,
	`botName` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clicks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailyAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`linkId` int NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`clickCount` int NOT NULL DEFAULT 0,
	`uniqueIps` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailyAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`shortCode` varchar(20) NOT NULL,
	`customAlias` varchar(255),
	`originalUrl` text NOT NULL,
	`password` varchar(255),
	`expiresAt` timestamp,
	`ogTitle` varchar(255),
	`ogDescription` text,
	`ogImage` text,
	`ogType` varchar(50) DEFAULT 'website',
	`totalClicks` int NOT NULL DEFAULT 0,
	`lastClickAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `links_id` PRIMARY KEY(`id`),
	CONSTRAINT `links_shortCode_unique` UNIQUE(`shortCode`),
	CONSTRAINT `links_customAlias_unique` UNIQUE(`customAlias`)
);
--> statement-breakpoint
CREATE INDEX `apiKeys_userId_idx` ON `apiKeys` (`userId`);--> statement-breakpoint
CREATE INDEX `clicks_linkId_idx` ON `clicks` (`linkId`);--> statement-breakpoint
CREATE INDEX `clicks_userId_idx` ON `clicks` (`userId`);--> statement-breakpoint
CREATE INDEX `clicks_createdAt_idx` ON `clicks` (`createdAt`);--> statement-breakpoint
CREATE INDEX `clicks_country_idx` ON `clicks` (`country`);--> statement-breakpoint
CREATE INDEX `clicks_deviceType_idx` ON `clicks` (`deviceType`);--> statement-breakpoint
CREATE INDEX `dailyAnalytics_linkId_date_idx` ON `dailyAnalytics` (`linkId`,`date`);--> statement-breakpoint
CREATE INDEX `dailyAnalytics_userId_idx` ON `dailyAnalytics` (`userId`);--> statement-breakpoint
CREATE INDEX `links_userId_idx` ON `links` (`userId`);--> statement-breakpoint
CREATE INDEX `links_shortCode_idx` ON `links` (`shortCode`);--> statement-breakpoint
CREATE INDEX `links_customAlias_idx` ON `links` (`customAlias`);--> statement-breakpoint
CREATE INDEX `links_expiresAt_idx` ON `links` (`expiresAt`);
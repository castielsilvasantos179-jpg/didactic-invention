CREATE TABLE `rateLimitTracking` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`userId` int,
	`apiKey` varchar(64),
	`ipAddress` varchar(45) NOT NULL,
	`endpoint` varchar(255) NOT NULL,
	`requestCount` int NOT NULL DEFAULT 1,
	`windowStart` timestamp NOT NULL,
	`windowEnd` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rateLimitTracking_id` PRIMARY KEY(`id`)
);

CREATE TABLE `userSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customDomain` varchar(255),
	`theme` enum('light','dark') NOT NULL DEFAULT 'light',
	`notificationsEnabled` boolean NOT NULL DEFAULT true,
	`notificationEmail` varchar(320),
	`defaultOgImage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `userSettings_userId_unique` UNIQUE(`userId`)
);

CREATE TABLE `webhooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`url` text NOT NULL,
	`events` varchar(255) NOT NULL,
	`secret` varchar(255) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhooks_id` PRIMARY KEY(`id`)
);

CREATE INDEX `rateLimitTracking_userId_idx` ON `rateLimitTracking` (`userId`);
CREATE INDEX `rateLimitTracking_ipAddress_idx` ON `rateLimitTracking` (`ipAddress`);
CREATE INDEX `rateLimitTracking_window_idx` ON `rateLimitTracking` (`windowStart`,`windowEnd`);
CREATE INDEX `userSettings_userId_idx` ON `userSettings` (`userId`);
CREATE INDEX `webhooks_userId_idx` ON `webhooks` (`userId`);

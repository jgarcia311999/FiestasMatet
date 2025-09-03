CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL,
	"img" text,
	"description" text,
	"starts_at" timestamp with time zone NOT NULL,
	"location" varchar(200) NOT NULL,
	"provisional" boolean DEFAULT false NOT NULL,
	"attendees" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"section_key" varchar(64) NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idea_sections" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"title" varchar(200) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "idea_items" ADD CONSTRAINT "idea_items_section_key_idea_sections_key_fk" FOREIGN KEY ("section_key") REFERENCES "public"."idea_sections"("key") ON DELETE cascade ON UPDATE no action;
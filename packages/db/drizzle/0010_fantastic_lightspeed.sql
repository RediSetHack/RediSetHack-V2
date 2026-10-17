ALTER TABLE "regions" ADD COLUMN "story_intro" text;

INSERT INTO "regions" ("name", "slug", "description", "story_intro", "sort_order")
VALUES ('The Signal at Dawn', 'signal-at-dawn', 'A beginner journey through programming and secure thinking.', 'A strange signal has reached the city. Follow its clues by learning to write clear programs and protect the people who depend on them.', 100)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "zones" ("region_id", "name", "slug", "description", "sort_order")
SELECT r.id, chapter.name, chapter.slug, chapter.description, chapter.sort_order
FROM "regions" r
CROSS JOIN (VALUES
  ('The First Message', 'first-message', 'Decode the signal and learn how programs make decisions.', 1),
  ('A Safe Reply', 'safe-reply', 'Build a reply that handles untrusted input with care.', 2)
) AS chapter(name, slug, description, sort_order)
WHERE r.slug = 'signal-at-dawn'
ON CONFLICT ("region_id", "slug") DO NOTHING;

INSERT INTO "stages" ("zone_id", "title", "slug", "lesson_content", "xp_reward", "sort_order")
SELECT z.id, stage.title, stage.slug, stage.lesson_content::jsonb, 10, stage.sort_order
FROM "zones" z
CROSS JOIN (VALUES
  ('first-message', 'Read the Signal', 'read-the-signal', '[{"type":"text","content":"Programs are instructions. We can inspect a message one character at a time and keep only the information we need."},{"type":"code","language":"python","content":"message = \"hello, learner\"\nprint(message.upper())"},{"type":"exercise","language":"python","prompt":"Print the signal in uppercase.","starterCode":"signal = \"hello, learner\"\n"}]', 1),
  ('first-message', 'Choose a Response', 'choose-a-response', '[{"type":"text","content":"A condition lets a program choose a response. Keep each branch clear so the next reader can follow the decision."},{"type":"code","language":"python","content":"if \"help\" in message:\n    print(\"We are listening.\")"}]', 2),
  ('safe-reply', 'Treat Input as Untrusted', 'treat-input-as-untrusted', '[{"type":"text","content":"Messages from outside your program are untrusted. Validate what you need before using it, and never treat input as an instruction to execute."},{"type":"code","language":"python","content":"name = input().strip()\nif name:\n    print(f\"Welcome, {name[:40]}\")"},{"type":"exercise","language":"python","prompt":"Trim a name and limit it to 40 characters.","starterCode":"name = input()\n"}]', 1),
  ('safe-reply', 'Send a Safe Reply', 'send-a-safe-reply', '[{"type":"text","content":"A safe reply is predictable and limited. Do not echo secrets, and keep the response focused on what the learner asked for."},{"type":"text","content":"You have completed the first journey. Continue exploring the catalog to practice more skills."}]', 2)
) AS stage(zone_slug, title, slug, lesson_content, sort_order)
WHERE z.slug = stage.zone_slug AND z.region_id = (SELECT id FROM "regions" WHERE slug = 'signal-at-dawn')
ON CONFLICT ("zone_id", "slug") DO NOTHING;

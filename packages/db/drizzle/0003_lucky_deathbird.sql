ALTER TABLE "quest_options" ADD COLUMN "authoring_id" text;--> statement-breakpoint
ALTER TABLE "quest_questions" ADD COLUMN "authoring_id" text;--> statement-breakpoint
DO $$
DECLARE
	legacy record;
	question jsonb;
	answer jsonb;
	question_order integer;
	answer_order integer;
	question_id integer;
BEGIN
	FOR legacy IN
		SELECT id, questions_json FROM quests
		WHERE jsonb_typeof(questions_json) = 'array'
			AND jsonb_array_length(questions_json) > 0
	LOOP
		FOR question, question_order IN SELECT value, ordinality::integer FROM jsonb_array_elements(legacy.questions_json) WITH ORDINALITY
		LOOP
			INSERT INTO quest_questions (quest_id, prompt, sort_order, authoring_id)
			VALUES (legacy.id, question->>'prompt', question_order - 1, question->>'id')
			RETURNING id INTO question_id;
			FOR answer, answer_order IN SELECT value, ordinality::integer FROM jsonb_array_elements(question->'options') WITH ORDINALITY
			LOOP
				INSERT INTO quest_options (question_id, text, is_correct, sort_order, authoring_id)
				VALUES (question_id, answer->>'text', answer->>'id' = question->>'correctOptionId', answer_order - 1, answer->>'id');
			END LOOP;
		END LOOP;
	END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "quests" DROP COLUMN "questions_json";

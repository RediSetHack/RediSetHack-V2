ALTER TABLE "results" ADD COLUMN "questions_json" jsonb;
--> statement-breakpoint
UPDATE results AS result
SET questions_json = (
	SELECT jsonb_agg(
		jsonb_build_object(
			'id', question.id,
			'prompt', question.prompt,
			'options', (
				SELECT jsonb_agg(
					jsonb_build_object('id', answer.id, 'text', answer.text, 'isCorrect', answer.is_correct)
					ORDER BY answer.sort_order, answer.id
				)
				FROM quest_options AS answer
				WHERE answer.question_id = question.id
			)
		)
		ORDER BY question.sort_order, question.id
	)
	FROM quest_questions AS question
	WHERE question.quest_id = result.quest_id
)
WHERE EXISTS (SELECT 1 FROM quest_questions WHERE quest_id = result.quest_id);

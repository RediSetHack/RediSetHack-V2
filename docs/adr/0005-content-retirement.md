# Content retirement preserves learning evidence

Content with Stage completions, Quest Sessions, Results, or XP claims is archived by setting `archived_at`. Archived content and its descendants are omitted from learner catalog discovery and cannot start new Quest Sessions. A Quest Session already active at retirement remains valid until its persisted deadline and can be submitted from its saved question snapshot; the submitted Result and first-pass XP claim retain their existing rules.

Content without those records may be physically deleted. Retirement does not delete progression, Results, XP claims, or Badge awards. Admin DELETE routes use this conditional behavior so existing authoring operations remain the interface.

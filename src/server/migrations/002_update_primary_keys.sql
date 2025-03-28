-- Rename primary key columns to be consistent
ALTER TABLE segments RENAME COLUMN id TO segment_id;
ALTER TABLE questions RENAME COLUMN id TO question_id;
ALTER TABLE responses RENAME COLUMN id TO response_id;

-- Update foreign key constraints
ALTER TABLE questions DROP CONSTRAINT questions_segment_id_fkey;
ALTER TABLE questions ADD CONSTRAINT questions_segment_id_fkey 
  FOREIGN KEY (segment_id) REFERENCES segments(segment_id) ON DELETE CASCADE;

ALTER TABLE responses DROP CONSTRAINT responses_question_id_fkey;
ALTER TABLE responses ADD CONSTRAINT responses_question_id_fkey 
  FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE;

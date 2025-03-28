-- Delete videos that have no segments (failed transcription attempts)
DELETE FROM videos
WHERE id IN (
  SELECT v.id
  FROM videos v
  LEFT JOIN segments s ON s.video_id = v.id
  WHERE s.id IS NULL
);

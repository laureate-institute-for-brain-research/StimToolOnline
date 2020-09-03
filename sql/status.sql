SELECT id,subjects.mkturk_id, status.task_chicken_T1, status.task_chicken_T2, subjects.task_version
FROM status
INNER JOIN subjects WHERE subjects.mkturk_id = status.mkturk_id;

SELECT id,subjects.mkturk_id, status.task_chicken_T1, status.task_chicken_T2, subjects.task_version
FROM status
INNER JOIN subjects WHERE subjects.mkturk_id = status.mkturk_id AND status.task_chicken_T1 = 'YES' AND status.task_chicken_T2 = 'YES';


SELECT id,subjects.mkturk_id, subjects.email, status.task_chicken_T1, status.task_chicken_T2, subjects.task_version
FROM status
INNER JOIN subjects WHERE subjects.mkturk_id = status.mkturk_id AND status.task_chicken_T1 = 'YES' and id > 275;

SELECT subjects.mkturk_id, status.task_chicken_T1, status.task_chicken_T2 
FROM status
INNER JOIN subjects WHERE subjects.mkturk_id = status.mkturk_id;
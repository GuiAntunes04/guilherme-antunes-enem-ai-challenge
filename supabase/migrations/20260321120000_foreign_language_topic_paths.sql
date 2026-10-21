-- Prefix subject_area with Inglês/Espanhol so topic explorer matches subject_name practice.
update enem_questions_index
set subject_area = case
  when subject_name = 'Inglês' then
    case
      when subject_area is null or btrim(subject_area) = '' then 'Inglês'
      when subject_area = 'Inglês' or subject_area like 'Inglês > %' then subject_area
      else 'Inglês > ' || subject_area
    end
  when subject_name = 'Espanhol' then
    case
      when subject_area is null or btrim(subject_area) = '' then 'Espanhol'
      when subject_area = 'Espanhol' or subject_area like 'Espanhol > %' then subject_area
      else 'Espanhol > ' || subject_area
    end
  else subject_area
end
where subject_name in ('Inglês', 'Espanhol');

CREATE UNIQUE INDEX "CourseFee_college_id_course_degree_key" ON "CourseFee"("college_id", "course", "degree");

CREATE UNIQUE INDEX "PlacementStat_college_id_year_key" ON "PlacementStat"("college_id", "year");

CREATE UNIQUE INDEX "AdmissionCutoff_college_id_exam_year_category_key" ON "AdmissionCutoff"("college_id", "exam", "year", "category");

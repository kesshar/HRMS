const calculateProductivityScore = (completed, assigned, overdue) => {
  if (assigned === 0) return 0;

  const baseScore = (completed / assigned) * 100;
  const penalty = overdue * 5;

  const finalScore = baseScore - penalty;

  return finalScore < 0 ? 0 : Math.round(finalScore);
};

module.exports = calculateProductivityScore;

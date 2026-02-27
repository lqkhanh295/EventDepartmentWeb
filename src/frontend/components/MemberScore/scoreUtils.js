export const getScoresBySemester = (member, semester) => {
    return member.scores?.[semester] || {};
};

export const getProjectScore = (member, project, currentSemester) => {
    if (currentSemester === 'year') {
        const scores = getScoresBySemester(member, project.semester);
        return scores[project.key] || 0;
    }
    const scores = getScoresBySemester(member, currentSemester);
    return scores[project.key] || 0;
};

export const countProjects = (member, projects, currentSemester) => {
    return projects.filter(p => getProjectScore(member, p, currentSemester) > 0).length;
};

export const calculateAverage = (member, projects, currentSemester) => {
    const validScores = projects.map(p => getProjectScore(member, p, currentSemester)).filter(s => s > 0);
    if (validScores.length === 0) return 0;
    return Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
};

export const calculateTotal = (member, projects, currentSemester) => {
    return projects.reduce((sum, p) => sum + getProjectScore(member, p, currentSemester), 0);
};

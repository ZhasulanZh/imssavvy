const users = [
    {
        id: 1,
        username: "airline",
        password: "airline123",
        role: "airline",
        name: "Airline Manager",
        email: "airline1@example.com",
        status: "active",
    },
    {
        id: 2,
        username: "admin",
        password: "admin123",
        role: "admin",
        name: "Administrator",
        email: "admin@example.com",
        status: "active",
    },
    {
        id: 3,
        username: "agency",
        password: "agency123",
        role: "agency",
        name: "Agency Manager",
        email: "agency@example.com",
        status: "active",
    },
    {
        id: 4,
        username: "agent",
        password: "agent123",
        role: "agent",
        name: "Agent",
        email: "agent@example.com",
        status: "active",
        agencyId: 3
    },
    // Добавьте других пользователей здесь
];

function findUser(username, password) {
    return users.find(user => user.username === username && user.password === password && user.status === 'active');
}

function findUserById(userId) {
    return users.find(user => user.id === userId);
}

function getAllUsers() {
    return users;
}

function getUsersByRole(role) {
    return users.filter(user => user.role === role);
}

function linkAgentToAgency(agentId, agencyId) {
    const agent = findUserById(agentId);
    if (agent && agent.role === 'agent') {
        agent.agencyId = agencyId;
    }
}

module.exports = {
    findUser,
    findUserById,
    getAllUsers,
    getUsersByRole,
    linkAgentToAgency
};

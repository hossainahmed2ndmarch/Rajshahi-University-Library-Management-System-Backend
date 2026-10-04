"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RudcTeamService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const db_1 = __importDefault(require("../../../lib/db"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const getAllRudcTeams = () => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.default.rudcTeam.findMany({
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            whatsappNumber: true,
                            avatarUrl: true,
                            department: true,
                            session: true,
                            skills: true,
                            rudcMemberType: true,
                            rudcStatus: true,
                        },
                    },
                },
            },
            _count: {
                select: { members: true },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
});
const createRudcTeam = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield db_1.default.rudcTeam.findUnique({
        where: { name: payload.name },
    });
    if (existing) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'A team with this name already exists!');
    }
    return db_1.default.rudcTeam.create({
        data: payload,
    });
});
const updateRudcTeam = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.default.rudcTeam.update({
        where: { id },
        data: payload,
    });
});
const deleteRudcTeam = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return db_1.default.rudcTeam.delete({
        where: { id },
    });
});
const assignTeamMembers = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { teamId, userIds, role = 'MEMBER' } = payload;
    const team = yield db_1.default.rudcTeam.findUnique({
        where: { id: teamId },
    });
    if (!team) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Team not found!');
    }
    const operations = userIds.map((userId) => db_1.default.userRudcTeam.upsert({
        where: {
            userId_teamId: {
                userId,
                teamId,
            },
        },
        create: {
            userId,
            teamId,
            role,
        },
        update: {
            role,
        },
    }));
    yield db_1.default.$transaction(operations);
    return db_1.default.rudcTeam.findUnique({
        where: { id: teamId },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatarUrl: true,
                            rudcMemberType: true,
                            rudcStatus: true,
                        },
                    },
                },
            },
        },
    });
});
const removeTeamMember = (teamId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield db_1.default.userRudcTeam.delete({
        where: {
            userId_teamId: {
                userId,
                teamId,
            },
        },
    });
    return { message: 'Member removed from team successfully' };
});
exports.RudcTeamService = {
    getAllRudcTeams,
    createRudcTeam,
    updateRudcTeam,
    deleteRudcTeam,
    assignTeamMembers,
    removeTeamMember,
};

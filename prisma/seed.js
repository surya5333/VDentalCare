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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var treatmentCatalogue_1 = require("../src/data/treatmentCatalogue");
var mockPatients_1 = require("../src/data/mockPatients");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, TREATMENT_CATALOGUE_1, treatment, _a, CROWN_CATALOGUE_1, crown, refs, _b, refs_1, r, existing, doctors, _c, doctors_1, d, existing, labs, _d, labs_1, lab, existing, bcrypt, defaultPasswordHash, roles, _e, roles_1, r, username, _f, mockPatientsData_1, mockOp, p, opRecord, parts, dateStr, _g, _h, ft, _j, _k, img, _l, _m, xray;
        return __generator(this, function (_o) {
            switch (_o.label) {
                case 0:
                    console.log('Seeding Master Data...');
                    _i = 0, TREATMENT_CATALOGUE_1 = treatmentCatalogue_1.TREATMENT_CATALOGUE;
                    _o.label = 1;
                case 1:
                    if (!(_i < TREATMENT_CATALOGUE_1.length)) return [3 /*break*/, 4];
                    treatment = TREATMENT_CATALOGUE_1[_i];
                    return [4 /*yield*/, prisma.treatment.upsert({
                            where: { id: treatment.id },
                            update: {
                                name: treatment.name,
                                patientPrice: treatment.patientPrice,
                                requiresTeethNotation: treatment.requiresTeethNotation
                            },
                            create: {
                                id: treatment.id,
                                name: treatment.name,
                                patientPrice: treatment.patientPrice,
                                requiresTeethNotation: treatment.requiresTeethNotation
                            }
                        })];
                case 2:
                    _o.sent();
                    _o.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    _a = 0, CROWN_CATALOGUE_1 = treatmentCatalogue_1.CROWN_CATALOGUE;
                    _o.label = 5;
                case 5:
                    if (!(_a < CROWN_CATALOGUE_1.length)) return [3 /*break*/, 8];
                    crown = CROWN_CATALOGUE_1[_a];
                    return [4 /*yield*/, prisma.crownType.upsert({
                            where: { id: crown.id },
                            update: {
                                name: crown.name,
                                patientPrice: crown.patientPrice,
                                labPrice: crown.labPrice
                            },
                            create: {
                                id: crown.id,
                                name: crown.name,
                                patientPrice: crown.patientPrice,
                                labPrice: crown.labPrice
                            }
                        })];
                case 6:
                    _o.sent();
                    _o.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    refs = ['Google', 'Friend', 'Walk-in', 'Practo'];
                    _b = 0, refs_1 = refs;
                    _o.label = 9;
                case 9:
                    if (!(_b < refs_1.length)) return [3 /*break*/, 13];
                    r = refs_1[_b];
                    return [4 /*yield*/, prisma.reference.findFirst({ where: { name: r } })];
                case 10:
                    existing = _o.sent();
                    if (!!existing) return [3 /*break*/, 12];
                    return [4 /*yield*/, prisma.reference.create({ data: { name: r } })];
                case 11:
                    _o.sent();
                    _o.label = 12;
                case 12:
                    _b++;
                    return [3 /*break*/, 9];
                case 13:
                    doctors = ['Dr. Anjali', 'Dr. Rahul', 'Dr. Kiran'];
                    _c = 0, doctors_1 = doctors;
                    _o.label = 14;
                case 14:
                    if (!(_c < doctors_1.length)) return [3 /*break*/, 18];
                    d = doctors_1[_c];
                    return [4 /*yield*/, prisma.doctor.findFirst({ where: { name: d } })];
                case 15:
                    existing = _o.sent();
                    if (!!existing) return [3 /*break*/, 17];
                    return [4 /*yield*/, prisma.doctor.create({ data: { name: d } })];
                case 16:
                    _o.sent();
                    _o.label = 17;
                case 17:
                    _c++;
                    return [3 /*break*/, 14];
                case 18:
                    labs = ['Smile Lab', 'Dental Arts', 'Precision Dentures'];
                    _d = 0, labs_1 = labs;
                    _o.label = 19;
                case 19:
                    if (!(_d < labs_1.length)) return [3 /*break*/, 23];
                    lab = labs_1[_d];
                    return [4 /*yield*/, prisma.lab.findFirst({ where: { name: lab } })];
                case 20:
                    existing = _o.sent();
                    if (!!existing) return [3 /*break*/, 22];
                    return [4 /*yield*/, prisma.lab.create({ data: { name: lab } })];
                case 21:
                    _o.sent();
                    _o.label = 22;
                case 22:
                    _d++;
                    return [3 /*break*/, 19];
                case 23:
                    console.log('Seeding Users...');
                    bcrypt = require('bcryptjs');
                    defaultPasswordHash = bcrypt.hashSync('password123', 10);
                    roles = ['FRONT_OFFICE', 'CLINIC_HEAD', 'WORKING_DOCTOR', 'MANAGER'];
                    _e = 0, roles_1 = roles;
                    _o.label = 24;
                case 24:
                    if (!(_e < roles_1.length)) return [3 /*break*/, 27];
                    r = roles_1[_e];
                    username = r.toLowerCase().replace('_', '');
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { username: username },
                            update: {},
                            create: {
                                username: username,
                                passwordHash: defaultPasswordHash,
                                role: r,
                            }
                        })];
                case 25:
                    _o.sent();
                    _o.label = 26;
                case 26:
                    _e++;
                    return [3 /*break*/, 24];
                case 27:
                    console.log('Seeding Mock OPs...');
                    _f = 0, mockPatientsData_1 = mockPatients_1.mockPatientsData;
                    _o.label = 28;
                case 28:
                    if (!(_f < mockPatientsData_1.length)) return [3 /*break*/, 43];
                    mockOp = mockPatientsData_1[_f];
                    p = mockOp.patient;
                    return [4 /*yield*/, prisma.oPRecord.findUnique({ where: { opNumber: p.opNumber } })];
                case 29:
                    opRecord = _o.sent();
                    if (!!opRecord) return [3 /*break*/, 42];
                    parts = p.date.split('/') // DD/MM/YYYY
                    ;
                    dateStr = parts.length === 3 ? "".concat(parts[2], "-").concat(parts[1], "-").concat(parts[0], "T00:00:00Z") : new Date().toISOString();
                    return [4 /*yield*/, prisma.oPRecord.create({
                            data: {
                                opNumber: p.opNumber,
                                patientName: p.patientName,
                                age: p.age,
                                sex: p.sex,
                                phone: p.phone,
                                date: new Date(dateStr),
                                reference: p.reference,
                                paidStatus: p.paidStatus,
                            }
                        })
                        // Create Finalized Treatments
                    ];
                case 30:
                    opRecord = _o.sent();
                    _g = 0, _h = mockOp.treatmentLab.finalizedTreatments || [];
                    _o.label = 31;
                case 31:
                    if (!(_g < _h.length)) return [3 /*break*/, 34];
                    ft = _h[_g];
                    return [4 /*yield*/, prisma.finalizedTreatment.create({
                            data: {
                                opRecordId: opRecord.id,
                                treatmentId: ft.treatmentId,
                                treatmentNameSnapshot: ft.treatmentName,
                                patientPriceSnapshot: ft.patientPrice,
                                requiresTeethNotation: ft.requiresTeethNotation,
                                teethNotation: ft.teethNotation ? JSON.parse(JSON.stringify(ft.teethNotation)) : null,
                                crownTypeId: ft.crownType || null,
                                numberOfCrowns: ft.numberOfCrowns || null,
                            }
                        })];
                case 32:
                    _o.sent();
                    _o.label = 33;
                case 33:
                    _g++;
                    return [3 /*break*/, 31];
                case 34:
                    _j = 0, _k = mockOp.treatmentPlanImages || [];
                    _o.label = 35;
                case 35:
                    if (!(_j < _k.length)) return [3 /*break*/, 38];
                    img = _k[_j];
                    return [4 /*yield*/, prisma.treatmentPlanImage.create({
                            data: {
                                opRecordId: opRecord.id,
                                fileUrl: img.url || '/placeholder.png',
                                originalFilename: img.filename,
                            }
                        })];
                case 36:
                    _o.sent();
                    _o.label = 37;
                case 37:
                    _j++;
                    return [3 /*break*/, 35];
                case 38:
                    _l = 0, _m = mockOp.xrayImages || [];
                    _o.label = 39;
                case 39:
                    if (!(_l < _m.length)) return [3 /*break*/, 42];
                    xray = _m[_l];
                    return [4 /*yield*/, prisma.xRay.create({
                            data: {
                                opRecordId: opRecord.id,
                                fileUrl: xray.url || '/placeholder.png',
                                originalFilename: xray.filename,
                            }
                        })];
                case 40:
                    _o.sent();
                    _o.label = 41;
                case 41:
                    _l++;
                    return [3 /*break*/, 39];
                case 42:
                    _f++;
                    return [3 /*break*/, 28];
                case 43:
                    console.log('Seed completed successfully.');
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error(e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentStatus = exports.UserRole = void 0;
// User Roles
var UserRole;
(function (UserRole) {
    UserRole["SUPER_ADMIN"] = "super_admin";
    UserRole["SCHOOL_ADMIN"] = "school_admin";
    UserRole["TEACHER"] = "teacher";
    UserRole["BURSAR"] = "bursar";
    UserRole["STUDENT"] = "student";
    UserRole["PARENT"] = "parent";
})(UserRole || (exports.UserRole = UserRole = {}));
// Student Status
var StudentStatus;
(function (StudentStatus) {
    StudentStatus["ACTIVE"] = "active";
    StudentStatus["GRADUATED"] = "graduated";
    StudentStatus["TRANSFERRED"] = "transferred";
    StudentStatus["EXPELLED"] = "expelled";
    StudentStatus["WITHDRAWN"] = "withdrawn";
})(StudentStatus || (exports.StudentStatus = StudentStatus = {}));
//# sourceMappingURL=index.js.map
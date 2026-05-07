import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db.config";
import {
  School,
  User,
  Student,
  Session,
  Term,
  Class,
  Subject,
  ClassSubject,
  Score,
  FeeStatus,
} from "../models";
import { UserRole, StudentStatus } from "../types";
import {
  generateStudentId,
  calculateGrade,
  hashPassword,
} from "../utils/helpers.util";
import { logger } from "../utils/logger.util";
import dotenv from "dotenv";

dotenv.config();

const NIGERIAN_FIRST_NAMES = [
  "Babatunde", "Olumide", "Chinonso", "Emeka", "Ngozi", "Aisha", "Fatima", "Abubakar",
  "Temitope", "Adeola", "Ifeanyi", "Chidi", "Amaka", "Zainab", "Halima", "Musa",
  "Ibrahim", "Blessing", "Joy", "Patience", "Oluwaseun", "Damilola", "Chinedu",
  "Onyeka", "Yinka", "Folake", "Tunde", "Segun", "Kunle", "Bisi"
];

const NIGERIAN_LAST_NAMES = [
  "Adeyemi", "Okoro", "Abubakar", "Bello", "Obi", "Eze", "Balogun", "Akindele",
  "Usman", "Sanni", "Ojo", "Lawal", "Nwachukwu", "Okafor", "Danjuma", "Ibrahim",
  "Yusuf", "Adebayo", "Oni", "Olatunji", "Mohammed", "Aliyu", "Umar", "Suleiman"
];

const JUNIOR_SUBJECTS = [
  { name: "Mathematics", code: "MAT" },
  { name: "English Language", code: "ENG" },
  { name: "Basic Science", code: "BSC" },
  { name: "Basic Technology", code: "BTCH" },
  { name: "Social Studies", code: "SOS" },
  { name: "Business Studies", code: "BUS" },
  { name: "Computer Science", code: "CMP" },
  { name: "Agric Science", code: "AGR" },
  { name: "Physical & Health Education", code: "PHE" },
  { name: "Cultural & Creative Arts", code: "CCA" },
  { name: "French", code: "FRN" },
  { name: "Yoruba Language", code: "YOR" },
];

const SENIOR_SUBJECTS = [
  { name: "Mathematics", code: "MAT" },
  { name: "English Language", code: "ENG" },
  { name: "Physics", code: "PHY" },
  { name: "Chemistry", code: "CHM" },
  { name: "Biology", code: "BIO" },
  { name: "Economics", code: "ECN" },
  { name: "Geography", code: "GEO" },
  { name: "Government", code: "GOV" },
  { name: "Literature-in-English", code: "LIT" },
  { name: "Financial Accounting", code: "ACC" },
  { name: "Commerce", code: "COM" },
  { name: "Further Mathematics", code: "FMA" },
];

const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  try {
    await connectDatabase();
    logger.info("Starting seed process...");

    // 1. Create School
    const schoolName = "Emerald International College";
    let school = await School.findOne({ name: schoolName });

    if (school) {
      logger.info("School already exists. Deleting existing data for a fresh start...");
      const schoolId = school._id;
      await Promise.all([
        User.deleteMany({ schoolId }),
        Student.deleteMany({ schoolId }),
        Session.deleteMany({ schoolId }),
        Term.deleteMany({ schoolId }),
        Class.deleteMany({ schoolId }),
        Subject.deleteMany({ schoolId }),
        ClassSubject.deleteMany({ schoolId }),
        Score.deleteMany({ schoolId }),
        FeeStatus.deleteMany({ schoolId }),
        School.deleteOne({ _id: schoolId }),
      ]);
      logger.info("Old data cleared.");
    }

    school = await School.create({
      name: schoolName,
      email: "info@emeraldcollege.edu.ng",
      phone: "08012345678",
      address: "12, Victory Estate, Lekki Phase 1",
      city: "Lekki",
      state: "Lagos",
      motto: "Knowledge and Integrity",
      established: 2010,
      settings: {
        maxStudentsPerClass: 40,
        gradingScale: "default",
        resultReleaseMode: "automatic",
      },
    });
    logger.info(`School created: ${school.name} (${school.code})`);

    // 2. Create School Admin
    const adminPassword = await hashPassword("Password123!");
    const schoolAdmin = await User.create({
      firstName: "Babatunde",
      lastName: "Adeyemi",
      email: "admin@emeraldcollege.edu.ng",
      password: adminPassword,
      role: UserRole.SCHOOL_ADMIN,
      schoolId: school._id,
      phone: "08033221144",
      status: "active",
      emailVerified: true,
    });
    logger.info("School admin created.");

    // 3. Create Session and Terms
    const currentYear = new Date().getFullYear();
    const session = await Session.create({
      schoolId: school._id,
      name: `${currentYear}/${currentYear + 1}`,
      startYear: currentYear,
      endYear: currentYear + 1,
      isCurrent: true,
    });

    const terms = await Term.insertMany([
      {
        schoolId: school._id,
        sessionId: session._id,
        name: "First Term",
        termNumber: 1,
        startDate: new Date(currentYear, 8, 1), // Sept
        endDate: new Date(currentYear, 11, 15), // Dec
        isCurrent: true,
      },
      {
        schoolId: school._id,
        sessionId: session._id,
        name: "Second Term",
        termNumber: 2,
        startDate: new Date(currentYear + 1, 0, 10), // Jan
        endDate: new Date(currentYear + 1, 3, 5), // April
        isCurrent: false,
      },
      {
        schoolId: school._id,
        sessionId: session._id,
        name: "Third Term",
        termNumber: 3,
        startDate: new Date(currentYear + 1, 4, 1), // May
        endDate: new Date(currentYear + 1, 6, 25), // July
        isCurrent: false,
      },
    ]);
    const currentTerm = terms[0];
    logger.info("Session and terms created.");

    // 4. Create Subjects
    const juniorSubjects = await Subject.insertMany(
      JUNIOR_SUBJECTS.map((s) => ({ ...s, schoolId: school!._id }))
    );
    const seniorSubjects = await Subject.insertMany(
      SENIOR_SUBJECTS.map((s) => ({ ...s, schoolId: school!._id }))
    );
    logger.info("Subjects created.");

    // 5. Create Teachers
    const teachers: any[] = [];
    const teacherPassword = await hashPassword("Teacher123!");
    for (let i = 0; i < 15; i++) {
      const teacher = await User.create({
        firstName: getRandom(NIGERIAN_FIRST_NAMES),
        lastName: getRandom(NIGERIAN_LAST_NAMES),
        email: `teacher${i + 1}@emeraldcollege.edu.ng`,
        password: teacherPassword,
        role: UserRole.TEACHER,
        schoolId: school._id,
        phone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
        status: "active",
        emailVerified: true,
      });
      teachers.push(teacher);
    }
    logger.info(`${teachers.length} teachers created.`);

    // 6. Create Classes
    const classes: any[] = [];
    const levels = [
      { name: "JSS 1", level: 1, arms: ["A", "B"] },
      { name: "JSS 2", level: 2, arms: ["A", "B"] },
      { name: "JSS 3", level: 3, arms: ["A", "B"] },
      { name: "SS 1", level: 4, arms: ["Science", "Commercial", "Arts"] },
      { name: "SS 2", level: 5, arms: ["Science", "Commercial", "Arts"] },
      { name: "SS 3", level: 6, arms: ["Science", "Commercial", "Arts"] },
    ];

    for (const l of levels) {
      for (const arm of l.arms) {
        const cls = await Class.create({
          schoolId: school._id,
          name: `${l.name} ${arm}`,
          level: l.level,
          section: arm.substring(0, 3).toUpperCase(),
          classTeacherId: getRandom(teachers)._id,
          capacity: 40,
        });
        classes.push(cls);
      }
    }
    logger.info(`${classes.length} classes created.`);

    // 7. Assign Subjects to Classes
    const classSubjects: any[] = [];
    for (const cls of classes) {
      const relevantSubjects = cls.level <= 3 ? juniorSubjects : seniorSubjects;
      
      // Assign all relevant subjects to this class
      for (const sub of relevantSubjects) {
        // If it's senior secondary, filter by arm
        if (cls.level > 3) {
            const arm = cls.name.split(" ")[2];
            const isCore = ["Mathematics", "English Language", "Economics", "Civic Education"].includes(sub.name);
            const isScience = ["Physics", "Chemistry", "Biology", "Further Mathematics"].includes(sub.name);
            const isCommercial = ["Financial Accounting", "Commerce"].includes(sub.name);
            const isArts = ["Government", "Literature-in-English", "CRS", "IRS"].includes(sub.name);

            if (!isCore) {
                if (arm === "Science" && !isScience) continue;
                if (arm === "Commercial" && !isCommercial) continue;
                if (arm === "Arts" && !isArts) continue;
            }
        }

        const cs = await ClassSubject.create({
          schoolId: school._id,
          classId: cls._id,
          subjectId: sub._id,
          teacherId: getRandom(teachers)._id,
          sessionId: session._id,
        });
        classSubjects.push(cs);
      }
    }
    logger.info(`${classSubjects.length} class-subject assignments created.`);

    // 8. Create Students and Scores
    const studentPassword = await hashPassword("Student123!");
    let studentCount = 0;
    
    for (const cls of classes) {
      const numStudents = 10 + Math.floor(Math.random() * 6); // 10-15 students per class
      for (let j = 0; j < numStudents; j++) {
        const firstName = getRandom(NIGERIAN_FIRST_NAMES);
        const lastName = getRandom(NIGERIAN_LAST_NAMES);
        const email = `student${studentCount + 1}@emeraldcollege.edu.ng`;
        
        const user = await User.create({
          firstName,
          lastName,
          email,
          password: studentPassword,
          role: UserRole.STUDENT,
          schoolId: school._id,
          phone: `070${Math.floor(10000000 + Math.random() * 90000000)}`,
          status: "active",
          emailVerified: true,
        });

        const student = await Student.create({
          userId: user._id,
          schoolId: school._id,
          studentId: generateStudentId(school.code, currentYear),
          classId: cls._id,
          dateOfBirth: new Date(currentYear - (10 + cls.level), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: Math.random() > 0.5 ? "male" : "female",
          parentName: `${getRandom(NIGERIAN_FIRST_NAMES)} ${lastName}`,
          parentPhone: `090${Math.floor(10000000 + Math.random() * 90000000)}`,
          parentEmail: `parent${studentCount + 1}@gmail.com`,
          admissionDate: new Date(currentYear, 8, 1),
          status: StudentStatus.ACTIVE,
        });

        // 9. Generate Scores for this student
        const studentClassSubjects = classSubjects.filter(cs => cs.classId.toString() === cls._id.toString());
        for (const cs of studentClassSubjects) {
          const test1 = Math.floor(Math.random() * 16) + 4; // 4-20
          const test2 = Math.floor(Math.random() * 16) + 4; // 4-20
          const exam = Math.floor(Math.random() * 41) + 20; // 20-60
          
          await Score.create({
            schoolId: school._id,
            studentId: student._id,
            classSubjectId: cs._id,
            termId: currentTerm._id,
            test1,
            test2,
            exam,
          });
        }

        // 10. Fee Status
        await FeeStatus.create({
            schoolId: school._id,
            studentId: student._id,
            termId: currentTerm._id,
            status: Math.random() > 0.3 ? "paid" : (Math.random() > 0.5 ? "partial" : "unpaid"),
            amountExpected: 150000,
            amountPaid: Math.random() > 0.3 ? 150000 : (Math.random() > 0.5 ? 75000 : 0),
            balance: 0, // Will be updated by hook or manually
            updatedBy: schoolAdmin._id,
        });

        studentCount++;
      }
      logger.info(`Created students for ${cls.name}`);
    }

    logger.info(`Seeding complete! Created 1 school, ${teachers.length} teachers, ${classes.length} classes, and ${studentCount} students.`);
    
    await disconnectDatabase();
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  }
}

seed();

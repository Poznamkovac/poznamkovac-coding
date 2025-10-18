import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "../public");
const outputFile = path.join(publicDir, "index.json");

/**
 * Check if a directory contains challenge folders (numeric names)
 * @param {string} dir - Directory to check
 * @returns {boolean}
 */
function hasChallenges(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.some((entry) => entry.isDirectory() && /^\d+$/.test(entry.name));
}

/**
 * Scan challenge directories and read metadata.json + assignment.md files
 * @param {string} dir - Directory containing challenges
 * @returns {Array} Array of challenge metadata
 */
function scanChallenges(dir) {
  const challenges = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory() && /^\d+$/.test(entry.name)) {
      const challengeDir = path.join(dir, entry.name);
      const metadataPath = path.join(challengeDir, "metadata.json");
      const assignmentMdPath = path.join(challengeDir, "assignment.md");
      if (!fs.existsSync(metadataPath) || !fs.existsSync(assignmentMdPath)) {
        console.warn(`Warning: Challenge ${entry.name} is missing metadata.json or assignment.md`);
        continue;
      }

      try {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
        const assignmentContent = fs.readFileSync(assignmentMdPath, "utf-8");
        const firstLine = assignmentContent.split("\n")[0];
        let title = `Challenge ${entry.name}`;

        if (firstLine?.startsWith("# ")) {
          title = firstLine.substring(2).trim();
        }

        challenges.push({
          id: entry.name,
          title,
          type: metadata.type || "code",
          difficulty: metadata.difficulty || "medium",
          maxScore: metadata.maxScore || 10,
        });
      } catch (error) {
        console.warn(`Warning: Failed to parse challenge ${entry.name}:`, error.message);
      }
    }
  }
  challenges.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  return challenges;
}

/**
 * Recursively scan a directory for courses and challenges
 * @param {string} dir - Directory to scan
 * @param {string} relativePath - Path relative to challenges root
 * @returns {Object|null} Course structure or null
 */
function scanDirectory(dir, relativePath = "") {
  const courseJsonPath = path.join(dir, "course.json");
  if (hasChallenges(dir)) {
    let courseData = {};
    if (fs.existsSync(courseJsonPath)) {
      try {
        courseData = JSON.parse(fs.readFileSync(courseJsonPath, "utf-8"));
      } catch (error) {
        console.warn(`Warning: Failed to parse ${courseJsonPath}:`, error.message);
      }
    }

    const challenges = scanChallenges(dir);

    return {
      slug: path.basename(dir),
      path: relativePath,
      title:
        courseData.title ||
        path
          .basename(dir)
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      description: courseData.description || "",
      challengeCount: challenges.length,
      challenges,
      subcourses: [],
    };
  }
  const subcourses = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      const subDir = path.join(dir, entry.name);
      const result = scanDirectory(subDir, subPath);

      if (result) {
        subcourses.push(result);
      }
    }
  }
  if (subcourses.length > 0) {
    const totalChallenges = subcourses.reduce((sum, course) => {
      return sum + course.challengeCount + (course.subcourses?.reduce((s, c) => s + c.challengeCount, 0) || 0);
    }, 0);

    let courseData = {};
    if (fs.existsSync(courseJsonPath)) {
      try {
        courseData = JSON.parse(fs.readFileSync(courseJsonPath, "utf-8"));
      } catch (error) {
        console.warn(`Warning: Failed to parse ${courseJsonPath}:`, error.message);
      }
    }

    return {
      slug: path.basename(dir),
      path: relativePath,
      title:
        courseData.title ||
        path
          .basename(dir)
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      description: courseData.description || "",
      challengeCount: totalChallenges,
      challenges: [],
      subcourses,
    };
  }

  return null;
}

/**
 * Generate course index for all languages
 */
function generateCourseIndex() {
  const index = {};
  const languages = ["sk", "en"];

  for (const lang of languages) {
    const langDir = path.join(publicDir, lang, "data");

    if (!fs.existsSync(langDir)) {
      console.warn(`Warning: ${langDir} does not exist`);
      continue;
    }

    const courses = [];
    const entries = fs.readdirSync(langDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const courseDir = path.join(langDir, entry.name);
        const result = scanDirectory(courseDir, entry.name);

        if (result) {
          courses.push(result);
        }
      }
    }

    index[lang] = courses;
  }
  fs.writeFileSync(outputFile, JSON.stringify(index, null, 2));
  console.log(`✓ Generated course index at ${outputFile}`);
  console.log(`  Found ${Object.keys(index).length} languages`);

  for (const [lang, courses] of Object.entries(index)) {
    const totalCourses = courses.length;
    const totalChallenges = courses.reduce((sum, c) => sum + c.challengeCount, 0);
    console.log(`  - ${lang}: ${totalCourses} courses, ${totalChallenges} challenges`);
  }
}

generateCourseIndex();

import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export default function challengeCountPlugin(): Plugin {
  return {
    name: 'challenge-count',

    buildStart() {
      const challengesDir = path.resolve(__dirname, 'public/data/ulohy');
      const categories = fs.readdirSync(challengesDir);
      
      const challengeCounts = categories.reduce((acc, category) => {
        const categoryDir = path.join(challengesDir, category);
        const challengeCount = fs.readdirSync(categoryDir).length;
        acc[category] = challengeCount;
        return acc;
      }, {} as Record<string, number>);

      fs.writeFileSync(
        path.resolve(__dirname, 'public/data/challenge-counts.json'),
        JSON.stringify(challengeCounts, null, 2)
      );
    },
  };
}
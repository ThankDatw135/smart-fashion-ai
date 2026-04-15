import fs from 'fs';
import path from 'path';

const contentPath = path.join(process.cwd(), 'src/data/content.json');

export function getStaticContent() {
  try {
    const fileContents = fs.readFileSync(contentPath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading static content:', error);
    return {};
  }
}

export function updateStaticContent(section: string, data: any) {
  try {
    const current = getStaticContent();
    current[section] = data;
    fs.writeFileSync(contentPath, JSON.stringify(current, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error updating static content:', error);
    return false;
  }
}

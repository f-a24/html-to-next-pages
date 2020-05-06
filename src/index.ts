import * as fs from 'fs';
import { exec } from 'child_process';
import { JSDOM } from 'jsdom';

const NEXT_DIR = './nextApps';
const HTML_DIR = './_html';
const COMPONENT_NAME = /__NAME__/g;
const CHILD_ELEMENT = '{/* CHILDREN */}'
const IMPORT_COMPONENT = '/* __IMPORT_COMPNENT__ */';
const reactTemplate = fs.readFileSync(`${NEXT_DIR}/_template.tsx`, 'utf8');

fs.readdir(HTML_DIR, (err, files) => {
    if (err) throw err;
    if (!fs.existsSync(`${NEXT_DIR}/pages`)) fs.mkdirSync(`${NEXT_DIR}/pages`);
    files.filter(file => fs.statSync(`${HTML_DIR}/${file}`).isFile() && /.*\.html$/.test(file))
    .forEach(file => {
        const html = fs.readFileSync(`${HTML_DIR}/${file}`, 'utf8');
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const body = document.querySelector('body')!;
        const compArray = Array.from(body.children).map(child => {
            const tagName = child.tagName.toUpperCase();
            if (tagName === 'H1') {
                return {
                    components: `import Title from '../components/Title'`,
                    element: `<Title text="${child.textContent}" />` };
            } else if (tagName === 'A') {
                const hrefLink = child.getAttribute('href');
                return {
                    components: `import Link from 'next/link'`,
                    element: `<Link href="${hrefLink?.replace('.html', '')}"><a>${child.textContent}</a></Link>`
            };
            } else {
                return { components: '', element: child.outerHTML }
            }
        });
        const compName = file.replace('.html', '');
        const upperCompName = compName.replace(/^./, match => match.toUpperCase());
        const fileString = reactTemplate
        .replace(COMPONENT_NAME, upperCompName)
        .replace(IMPORT_COMPONENT, compArray.map(({ components }) => components).join('\n'))
        .replace(CHILD_ELEMENT, compArray.map(({ element }) => element).join('\n'));
        fs.writeFile(`${NEXT_DIR}/pages/${compName}.tsx`, fileString, err => { console.log(err); });
    });

    exec(`yarn next build ${NEXT_DIR} && yarn next export ${NEXT_DIR} -o public`, (err, stdout, stderr) => {
        if (err) {
          console.log(`stderr: ${stderr}`)
          return
        }
        console.log(`stdout: ${stdout}`)
      }
    );
});


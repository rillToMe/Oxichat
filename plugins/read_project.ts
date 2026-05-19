import * as fs from 'fs';
import * as path from 'path';
import * as process from 'process';

// Ambil argumen path file dari command line
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error("Error: Path file tidak diberikan.");
    process.exit(1);
}

const targetPath = path.resolve(args[0]!);

try {
    if (!fs.existsSync(targetPath)) {
        console.error(`Error: File tidak ditemukan di -> ${targetPath}`);
        process.exit(1);
    }

    // Baca isi file
    const content = fs.readFileSync(targetPath, 'utf-8');
    
    console.log(`\n--- ISI FILE: ${targetPath} ---\n`);
    console.log(content);
    console.log(`\n--- AKHIR FILE ---\n`);

} catch (error: any) {
    console.error(`Error gagal membaca file: ${error.message}`);
    process.exit(1);
}
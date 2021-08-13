const path = require('path');
const fs = require('fs');
const NDDB = require('NDDB');
const J = require('JSUS').JSUS;



const getDefaultExportDir = conf => {
    return path.join(conf.ngDir, 'export');
};

/**
* ### getExtension
*
* Extracts the extension from a file name
*
*
* @param {string} file The filename
*
* @return {string} The extension or NULL if not found
*/
const getExtension = (file) => {
    let format = file.lastIndexOf('.');
    return format < 0 ? null : file.substr(format + 1);
};

/**
* ### getExtension
*
* Extracts the extension from a file name
*
*
* @param {string} file The filename
*
* @return {string} The extension or NULL if not found
*/
const incrementFileIdx = (file, idx = 0) => {
    let format = file.lastIndexOf('.');
    return `${file.substr(0, format)}_${++idx}${file.substr(format)}`;
};

// Keeps track of open saving operations
let saving = 0;

const exportLogs = (serverConf, opts, cb) => {

    // Data directory.
    const DATADIR = path.resolve(serverConf.ngDir, 'logs');

    // Output directory.
    const OUTDIR = opts.exportDir ?? getDefaultExportDir(serverConf);

    // Limit to room numbers.

    const minLog = opts.minLog || false;
    const maxLog = opts.maxLog || false;

    const dirFilter = (dir) => {
        // Filter room number.
        if (minLog || maxLog) {
            let roomNum = dir.split('room')[1];
            roomNum = J.isInt(roomNum);
            // Skip directories not like rooom0000X.
            if (!roomNum) return false;
            if (minLog && roomNum < minLog) return false;
            if (maxLog && roomNum > maxLog) return false;
        }
        return true;
    };

    // Convert to CSV.
    const CONVERT_JSON_TO_CSV = opts.json2csv ?? true;

    // Create a sub-directory within export directory.
    const CREATE_EXPORT_SUBDIR = opts.exportSubdir ?? false;

    // 'err' | 'append' ;
    const ON_DUPLICATED_NAMES = opts.onDuplicatedNames ?? 'rename';

    // TODO: implement it.
    const VERBOSE = opts.verbose ?? true;

    const INCOMING = opts.incoming ?? true;

    const OUTGOING = opts.outgoing ?? false;

    if (!INCOMING && !OUTGOING) {
        console.log(' - Err: export logs messages must specify either ' +
                    ' incoming outgoing');
        return;
    }

    // Load all files.

    let checkUnique = {};

    if (!fs.existsSync(OUTDIR)) {
        fs.mkdirSync(OUTDIR);
        console.log('- created ' + OUTDIR);
    }

    let OUTDIR_EXPORT = OUTDIR;

    if (CREATE_EXPORT_SUBDIR) {
        // Create dir name based on time.
        let t = new Date().toISOString().replaceAll(':', '-').replace('T', '_');
        t = t.substr(0, t.lastIndexOf('.'));

        OUTDIR_EXPORT = path.join(OUTDIR, t);
        if (!fs.existsSync(OUTDIR_EXPORT)) {
            fs.mkdirSync(OUTDIR_EXPORT);
            console.log('- created ' + OUTDIR_EXPORT);
        }
    }

    // Array of files that will be loaded (if found).
    const FILES = [
        'messages'
    ];

    FILES.forEach((file) => {
        if (checkUnique[file]) {
            console.log(`- skipping duplicated file: ${file}`);
            return;
        }
        console.log('- searching for files with pattern: ' + file);

        checkUnique[file] = true;

        let db = NDDB.db();
        let db2;

        db2 = NDDB.db();
        db.on('insert', (item) => {
            if (item.type === 'out-ID') {
                if (!OUTGOING) return false;
            }
            else {
                if (!INCOMING) return false;
            }

            let i = J.parse(item.message);
            // console.log(i);
            // console.log(i.sid);
            if (!i.sid || !~i.sid.indexOf('explorer1')) return false;

            if (DONE_ONLY) {
                if (!i.data || !i.data.done) return false;
            }

            // Session is the server session (not the room number).
            if (SESSION && i.session !== SESSION) return false;

            i.player = i.from;

            delete i.from;
            delete i.id;
            delete i.sid;

            db2.insert(i);
        });


        // Load files.
        let opts = {
            recursive: false,
            filter: file,
            // dirFilter: dirFilter
            // Alternative filters:
            // filter: file => file === 'bonus_prolific.csv',
            // format: 'csv',
        };

        db.loadDirSync(DATADIR, opts);

        // Check size.
        console.log(' items loaded: ' + db.size());
        if (!db.size()) return;

        // Save out file.
        opts = {};


        if (CONVERT_JSON_TO_CSV) {
            let ext = getExtension(file);
            if (ext !== 'csv') {
                file = file += '.csv';
                opts.header = 'all';
                opts.flatten = true;
                opts.flattenByGroup = 'player';
            }
        }

        let outFile = path.resolve(OUTDIR_EXPORT, file);

        // If file with same name already exists in out directory take action.
        if (fs.existsSync(outFile)) {
            if (ON_DUPLICATED_NAMES === 'err') {
                throw new Error(`out file already existing: ${outFile}`);
            }
            else if (ON_DUPLICATED_NAMES === 'rename') {
                let idx = -1;
                for (; ++idx < 100;) {
                    outFile = incrementFileIdx(file, idx);
                    outFile = path.resolve(OUTDIR_EXPORT, outFile);
                    if (!fs.existsSync(outFile)) break;
                }
                if (idx === 100) {
                    throw new Error(
                        `max number of files with same suffix in directory` +
                        `reached: ${file}`
                    );
                }
            } else {
                opts.append = true;
            }
        }

        saving++;
        db2.save(outFile, opts, () => {
            if (--saving <= 0) cb();
        });
    });
};


const exportData = (serverConf, gameName, opts, cb) => {



    // Data directory.
    const DATADIR = path.resolve(serverConf.ngGamesEnabledDir, gameName,'data');

    // Output directory.
    const OUTDIR = opts.exportDir ?? getDefaultExportDir(serverConf);

    // Limit to room numbers.

    const minRoom = opts.minRoom || false;
    const maxRoom = opts.maxRoom || false;

    const dirFilter = (dir) => {
        // Filter room number.
        if (minRoom || maxRoom) {
            let roomNum = dir.split('room')[1];
            roomNum = J.isInt(roomNum);
            // Skip directories not like rooom0000X.
            if (!roomNum) return false;
            if (minRoom && roomNum < minRoom) return false;
            if (maxRoom && roomNum > maxRoom) return false;
        }
        return true;
    };

    // Convert to CSV.
    const CONVERT_JSON_TO_CSV = opts.json2csv ?? true;

    // Create a sub-directory within export directory.
    const CREATE_EXPORT_SUBDIR = opts.exportSubdir ?? false;

    // 'err' | 'append' ;
    const ON_DUPLICATED_NAMES = opts.onDuplicatedNames ?? 'rename';

    // TODO: implement it.
    const VERBOSE = opts.verbose ?? true;

    // Load all files.

    let checkUnique = {};

    // TODO make own method.
    if (!fs.existsSync(OUTDIR)) {
        fs.mkdirSync(OUTDIR);
        console.log('- created ' + OUTDIR);
    }

    let OUTDIR_EXPORT = OUTDIR;

    if (CREATE_EXPORT_SUBDIR) {
        // Create dir name based on time.
        let t = new Date().toISOString().replaceAll(':', '-').replace('T', '_');
        t = t.substr(0, t.lastIndexOf('.'));

        OUTDIR_EXPORT = path.join(OUTDIR, t);
        if (!fs.existsSync(OUTDIR_EXPORT)) {
            fs.mkdirSync(OUTDIR_EXPORT);
            console.log('- created ' + OUTDIR_EXPORT);
        }
    }

    // Array of files that will be loaded (if found).
    const FILES = [
        'bonus_prolific.csv',
        'bonus.csv',
        'memory.json',
        // 'messages'
        'memory.csv',
        'data.json',
        'data.csv',
        'times.csv',
        'times_json',
        'player_data.csv',
        'player_data.json'
    ];

    console.log()

    FILES.forEach((file) => {
        if (checkUnique[file]) {
            console.log(`- skipping duplicated file: ${file}`);
            return;
        }
        console.log('- searching for files with pattern: ' + file);

        checkUnique[file] = true;

        let db = NDDB.db();

        // Load files.
        let opts = {
            recursive: true,
            filter: file,
            dirFilter: dirFilter
            // Alternative filters:
            // filter: file => file === 'bonus_prolific.csv',
            // format: 'csv',
        };
        if (file === 'bonus_prolific.csv') opts.header = false;
        db.loadDirSync(DATADIR, opts);

        // Check size.
        console.log(' items loaded: ' + db.size());
        if (!db.size()) return;

        // Save out file.
        opts = {};
        if (file === 'bonus_prolific.csv') {
            opts = {
                header: false,
                quote: '',
            };
        }

        if (CONVERT_JSON_TO_CSV) {
            let ext = getExtension(file);
            if (ext !== 'csv') {
                file = file += '.csv';
                opts.header = 'all';
                opts.flatten = true;
                opts.flattenByGroup = 'player';
            }
        }

        let outFile = path.resolve(OUTDIR_EXPORT, file);

        // If file with same name already exists in out directory take action.
        if (fs.existsSync(outFile)) {
            if (ON_DUPLICATED_NAMES === 'err') {
                throw new Error(`out file already existing: ${outFile}`);
            }
            else if (ON_DUPLICATED_NAMES === 'rename') {
                let idx = -1;
                for (; ++idx < 100;) {
                    outFile = incrementFileIdx(file, idx);
                    outFile = path.resolve(OUTDIR_EXPORT, outFile);
                    if (!fs.existsSync(outFile)) break;
                }
                if (idx === 100) {
                    throw new Error(
                        `max number of files with same suffix in directory` +
                        `reached: ${file}`
                    );
                }
            } else {
                opts.append = true;
            }
        }

        db.save(outFile, opts, () => {
            if (--saving <= 0) cb();
        });
    });
};



module.exports = { logs: exportLogs, data: exportData };

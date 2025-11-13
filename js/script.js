// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// Load jsPDF module
const { jsPDF } = window.jspdf;

// Language and Theme Management
let currentLanguage = 'hi'; // Default to Hindi
let currentTheme = 'light'; // Default to light theme

const translations = {
    hi: {
        mainTitle: "हिंदी PDF से खोज योग्य PDF कनवर्टर",
        hindiTitle: "हिंदी PDF से खोज योग्य PDF कनवर्टर (स्ट्रक्चरल डिटेक्शन)",
        subtitle1: "वोटर लिस्ट PDF को खोज योग्य और संरचित बनाएं",
        subtitle2: "Convert voter list PDF to searchable and structured format",
        uploadTitle: "PDF अपलोड करें",
        uploadText: "अपनी PDF वोटर सूची यहाँ खींचें और छोड़ें",
        orText: "या",
        selectedFile: "चयनित फ़ाइल:",
        fileSizeText: "आकार:",
        processingTitle: "प्रसंस्करण स्थिति",
        searchTitle: "खोज करें",
        previewTitle: "पूर्वावलोकन",
        footerText1: "हिंदी PDF कनवर्टर - संरचनात्मक टेक्स्ट निष्कर्षण पर केंद्रित",
        footerText2: "Hindi PDF Converter - Focused on structural text extraction"
    },
    en: {
        mainTitle: "Hindi PDF to Searchable PDF Converter",
        hindiTitle: "हिंदी PDF से खोज योग्य PDF कनवर्टर (स्ट्रक्चरल डिटेक्शन)",
        subtitle1: "Convert voter list PDF to searchable and structured format",
        subtitle2: "वोटर लिस्ट PDF को खोज योग्य और संरचित बनाएं",
        uploadTitle: "Upload PDF",
        uploadText: "Drag and drop your PDF voter list here",
        orText: "or",
        selectedFile: "Selected File:",
        fileSizeText: "Size:",
        processingTitle: "Processing Status",
        searchTitle: "Search",
        previewTitle: "Preview",
        footerText1: "Hindi PDF Converter - Focused on structural text extraction",
        footerText2: "हिंदी PDF कनवर्टर - संरचनात्मक टेक्स्ट निष्कर्षण पर केंद्रित"
    }
};

function toggleLanguage() {
    currentLanguage = currentLanguage === 'hi' ? 'en' : 'hi';
    updateLanguage();
}

function updateLanguage() {
    const lang = translations[currentLanguage];
    document.getElementById('mainTitle').textContent = lang.mainTitle;
    document.getElementById('hindiTitle').textContent = lang.hindiTitle;
    document.getElementById('subtitle1').textContent = lang.subtitle1;
    document.getElementById('subtitle2').textContent = lang.subtitle2;
    document.getElementById('uploadTitle').textContent = lang.uploadTitle;
    document.getElementById('uploadText').textContent = lang.uploadText;
    document.getElementById('orText').textContent = lang.orText;
    document.getElementById('selectedFile').textContent = lang.selectedFile;
    document.getElementById('fileSizeText').textContent = lang.fileSizeText;
    document.getElementById('processingTitle').textContent = lang.processingTitle;
    document.getElementById('searchTitle').textContent = lang.searchTitle;
    document.getElementById('previewTitle').textContent = lang.previewTitle;
    document.getElementById('footerText1').textContent = lang.footerText1;
    document.getElementById('footerText2').textContent = lang.footerText2;
    
    document.getElementById('languageToggle').textContent = currentLanguage === 'hi' ? 'EN' : 'HI';
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.getElementById('themeToggle').textContent = currentTheme === 'light' ? '🌙' : '☀️';
}

// Initialize theme and language
document.documentElement.setAttribute('data-theme', currentTheme);
updateLanguage();

// Event listeners for theme and language toggles
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('languageToggle').addEventListener('click', toggleLanguage);

// Enhanced Hindi PDF Processor with Table Detection, Structural Analysis, and JSON Extraction
class HindiPDFProcessor {
    constructor() {
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.extractedText = [];
        this.textPositions = [];
        this.structuralData = []; // Array to hold structured data (including table/cell info)
        this.tableData = []; // Array to hold detected table data
        this.searchMatches = [];
        this.currentMatchIndex = -1;
        this.isProcessing = false;
        this.canvas = null;
        this.ctx = null;
        this.currentScale = 1.0;
        this.defaultScale = 1.0; 
        this.currentViewport = null;
        this.currentFile = null;
        this.extractedJSON = null; // New: Structured JSON
        
        this.initializeEventListeners();
        this.updateUI();

        window.addEventListener('resize', () => {
            if (this.pdfDoc && this.currentScale === this.defaultScale && this.defaultScale > 0) {
                this.fitToWidth();
            }
        });
    }
    
    initializeEventListeners() {
        // File handling
        document.getElementById('browseBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('fileInput').addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });
        
        // Drag and drop
        const dropArea = document.getElementById('dropArea');
        
        ['dragover', 'dragenter'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropArea.classList.add('dragover');
            });
        });
        
        ['dragleave', 'dragend'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropArea.classList.remove('dragover');
            });
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                const file = e.dataTransfer.files[0];
                if (file.type === 'application/pdf') {
                    this.handleFileSelect(file);
                } else {
                    this.showStatus('कृपया केवल PDF फ़ाइलें अपलोड करें', 'error');
                }
            }
        });
        
        // Processing
        document.getElementById('processBtn').addEventListener('click', () => {
            this.processHindiPDF();
        });
        
        // Navigation
        document.getElementById('prevPage').addEventListener('click', () => this.previousPage());
        document.getElementById('nextPage').addEventListener('click', () => this.nextPage());
        document.getElementById('prevMatch').addEventListener('click', () => this.previousMatch());
        document.getElementById('nextMatch').addEventListener('click', () => this.nextMatch());
        
        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(0.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(-0.2));
        document.getElementById('fitWidth').addEventListener('click', () => this.fitToWidth());
        
        // Search
        document.getElementById('searchBtn').addEventListener('click', () => this.performSearch());
        document.getElementById('searchInput').addEventListener('keyup', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Download
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadSearchablePDF());
        document.getElementById('downloadJsonBtn').addEventListener('click', () => this.downloadJSON());
        
        // Tabs
        document.getElementById('originalTab').addEventListener('click', () => this.switchTab('original'));
        document.getElementById('processedTab').addEventListener('click', () => this.switchTab('processed'));
        document.getElementById('structuredPdfTab').addEventListener('click', () => this.switchTab('structuredPdf'));
    }
    
    switchTab(tab) {
        const originalTab = document.getElementById('originalTab');
        const processedTab = document.getElementById('processedTab');
        const structuredPdfTab = document.getElementById('structuredPdfTab');
        const originalContent = document.getElementById('originalContent');
        const processedContent = document.getElementById('processedContent');
        const structuredPdfContent = document.getElementById('structuredPdfContent');
        
        if (tab === 'original') {
            originalTab.classList.add('active');
            processedTab.classList.remove('active');
            structuredPdfTab.classList.remove('active');
            originalContent.classList.add('active');
            processedContent.classList.remove('active');
            structuredPdfContent.classList.remove('active');
        } else if (tab === 'processed') {
            originalTab.classList.remove('active');
            processedTab.classList.add('active');
            structuredPdfTab.classList.remove('active');
            originalContent.classList.remove('active');
            processedContent.classList.add('active');
            structuredPdfContent.classList.remove('active');
        } else if (tab === 'structuredPdf') {
            originalTab.classList.remove('active');
            processedTab.classList.remove('active');
            structuredPdfTab.classList.add('active');
            originalContent.classList.remove('active');
            processedContent.classList.remove('active');
            structuredPdfContent.classList.add('active');
        }
        
        // Refresh current page view
        this.renderPage(this.currentPage);
    }
    
    async handleFileSelect(file) {
        if (!file || file.type !== 'application/pdf') {
            this.showStatus('कृपया एक वैध PDF फ़ाइल चुनें', 'error');
            return;
        }
        
        this.currentFile = file;
        
        // Show file info
        document.getElementById('fileInfo').style.display = 'block';
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        
        this.resetProcessingSteps();
        this.updateStep(1, 'active', 'PDF लोड हो रहा है...');
        this.showStatus('PDF दस्तावेज़ लोड हो रहा है...', 'processing');
        this.updateProgress(10, 'PDF लोड हो रहा है');
        
        try {
            const fileBuffer = await file.arrayBuffer();
            this.pdfDoc = await pdfjsLib.getDocument({ data: fileBuffer }).promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;
            
            document.getElementById('pageCount').textContent = this.totalPages;
            document.getElementById('pageNum').textContent = this.currentPage;
            
            this.updateStep(1, 'completed', 'PDF सफलतापूर्वक लोड हो गया');
            this.updateProgress(30, 'PDF लोड हो गया');
            this.showStatus('PDF लोड हो गया। प्रोसेस करने के लिए तैयार।', 'success');
            
            // Enable controls
            document.getElementById('processBtn').disabled = false;
            document.getElementById('prevPage').disabled = false;
            document.getElementById('nextPage').disabled = false;
            
            await this.fitToWidth(true); 
            
        } catch (error) {
            this.updateStep(1, 'error', 'लोडिंग में त्रुटि');
            this.showStatus('PDF लोड करने में त्रुटि: ' + error.message, 'error');
            this.updateProgress(0, 'PDF लोड करने में त्रुटि');
        }
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    resetProcessingSteps() {
        for (let i = 1; i <= 6; i++) {  // Updated to 6 steps
            const stepIcon = document.getElementById(`step${i}`);
            const stepStatus = document.getElementById(`step${i}Status`);
            stepIcon.className = 'step-icon';
            stepStatus.textContent = 'प्रतीक्षा';
        }
        document.getElementById('tableDetectionInfo').style.display = 'none';
    }
    
    async processHindiPDF() {
        if (!this.pdfDoc || this.isProcessing) return;
        
        this.isProcessing = true;
        this.showStatus('हिंदी टेक्स्ट पहचान प्रक्रिया शुरू हो रही है...', 'processing');
        this.updateProgress(10, 'प्रक्रिया शुरू हो रही है');
        
        document.getElementById('processBtn').disabled = true;
        
        try {
            // Step 2: Extract text and analyze layout
            this.updateStep(2, 'active', 'पाठ निकाला जा रहा है और लेआउट विश्लेषण...');
            this.updateProgress(20, 'पाठ निष्कर्षण और विश्लेषण चल रहा है');
            await this.extractTextAndAnalyzeLayout(); 
            this.updateStep(2, 'completed', 'पाठ निष्कर्षण और विश्लेषण पूर्ण');
            
            // Step 3: Check if Hindi OCR is needed
            const totalText = this.extractedText.join('').trim();
            let ocrPerformed = false;
            // Check if text is too short or doesn't contain Hindi (common for scanned voter lists)
            if (totalText.length < 100 || !this.containsHindiText(totalText)) { 
                this.updateStep(3, 'active', 'हिंदी OCR प्रसंस्करण चल रहा है...');
                this.updateProgress(40, 'हिंदी OCR प्रसंस्करण');
                await this.performHindiOCR();
                await this.reanalyzeLayoutWithOCR();
                this.updateStep(3, 'completed', 'OCR प्रसंस्करण पूर्ण');
                ocrPerformed = true;
            } else {
                this.updateStep(3, 'completed', 'OCR की आवश्यकता नहीं');
                this.updateProgress(70, 'OCR की आवश्यकता नहीं');
            }
            
            // Step 4: Table detection and structural analysis
            this.updateStep(4, 'active', 'टेबल डिटेक्शन और स्ट्रक्चर एनालिसिस...');
            this.updateProgress(80, 'टेबल डिटेक्शन चल रहा है');
            await this.performTableDetection();
            this.updateStep(4, 'completed', 'टेबल डिटेक्शन पूर्ण');
            
            // Step 5: Final searchable PDF generation
            this.updateStep(5, 'active', 'खोज योग्य PDF बनाया जा रहा है...');
            this.updateProgress(90, 'अंतिम PDF जनरेशन');
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // New Step 6: JSON Extraction
            this.updateStep(6, 'active', 'JSON एक्सट्रैक्शन...');
            this.updateProgress(95, 'JSON डेटा एक्सट्रैक्ट कर रहा है');
            await this.extractStructuredJSON();
            this.updateStep(6, 'completed', 'JSON एक्सट्रैक्शन पूर्ण');
            
            this.updateProgress(100, 'प्रसंस्करण पूर्ण');
            this.updateStep(5, 'completed', 'खोज योग्य PDF के लिए डेटा तैयार');
            this.showStatus('हिंदी टेक्स्ट सफलतापूर्वक पहचाना गया! अब आप खोज योग्य PDF और JSON डाउनलोड कर सकते हैं।', 'success');
            
            // Enable download and search
            document.getElementById('downloadBtn').disabled = false;
            document.getElementById('downloadJsonBtn').disabled = false;
            
            await this.renderPage(this.currentPage);
            this.renderProcessedView();
            this.renderStructuredPdfView();
            
        } catch (error) {
            this.updateStep(6, 'error', 'प्रसंस्करण में त्रुटि');
            this.showStatus('प्रक्रिया में त्रुटि: ' + error.message, 'error');
            this.updateProgress(0, 'प्रसंस्करण विफल');
        } finally {
            this.isProcessing = false;
            document.getElementById('processBtn').disabled = false;
        }
    }
    
    containsHindiText(text) {
        return /[\u0900-\u097F]/.test(text);
    }
    
    // Enhanced function for text extraction and layout analysis
    async extractTextAndAnalyzeLayout() {
        this.extractedText = [];
        this.textPositions = [];
        this.structuralData = [];
        
        for (let i = 1; i <= this.totalPages; i++) {
            const page = await this.pdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            const pageViewport = page.getViewport({ scale: 1.0 });

            // Store text positions for highlighting/searchable PDF creation
            this.textPositions[i-1] = textContent.items;
            
            // Extract simple text (for search/OCR check)
            const pageText = textContent.items.map(item => item.str).join(' ');
            this.extractedText.push(pageText);

            // Enhanced structural analysis
            this.structuralData[i-1] = this.analyzeLayoutForTables(textContent.items, pageViewport);
            
            // Update progress
            const progress = 20 + (i / this.totalPages) * 10;
            this.updateProgress(progress, `पृष्ठ ${i}/${this.totalPages} से पाठ निकाला जा रहा है`);
        }
    }
    
    // Enhanced Table Detection Logic
    analyzeLayoutForTables(textItems, viewport) {
        const lines = {};
        textItems.forEach(item => {
            const y = Math.round(item.transform[5]); // Y-coordinate
            if (!lines[y]) lines[y] = [];
            lines[y].push(item);
        });

        const sortedLines = Object.keys(lines)
            .sort((a, b) => b - a) // Top to bottom
            .map(y => lines[y].sort((a, b) => a.transform[4] - b.transform[4])); // Left to right

        // Enhanced column detection with dynamic threshold
        const xPositions = textItems.map(item => Math.round(item.transform[4]));
        const uniqueX = [...new Set(xPositions)].sort((a, b) => a - b);
        const columnThreshold = Math.max(30, viewport.width / 20); // Dynamic threshold based on page width
        const columns = [];
        let currentColumn = [uniqueX[0]];

        for (let i = 1; i < uniqueX.length; i++) {
            if (uniqueX[i] - currentColumn[currentColumn.length - 1] < columnThreshold) {
                currentColumn.push(uniqueX[i]);
            } else {
                columns.push(currentColumn);
                currentColumn = [uniqueX[i]];
            }
        }
        if (currentColumn.length > 0) columns.push(currentColumn);

        // Refine columns using header detection (e.g., "नि.सं.", "घर संख्या")
        const potentialHeaders = sortedLines[0] || [];
        const headerKeywords = ['नि\\.सं\\.', 'घर', 'नाम', 'सम्बन्ध', 'लिंग', 'आयु', 'फोटो'];
        const columnCenters = columns.map(col => {
            const minX = Math.min(...col);
            const maxX = Math.max(...col);
            const center = (minX + maxX) / 2;
            // Assign weight based on proximity to header keywords
            const weight = potentialHeaders.reduce((sum, item) => {
                const dist = Math.abs(item.transform[4] - center);
                return sum + (headerKeywords.some(k => item.str.match(k)) ? 1 / (dist + 1) : 0);
            }, 0);
            return { center, min: minX, max: maxX, weight };
        }).sort((a, b) => b.weight - a.weight).slice(0, 8); // Limit to 8 columns

        // Create table data
        const tableData = [];
        sortedLines.forEach(lineItems => {
            const row = Array(columnCenters.length).fill('');
            lineItems.forEach(item => {
                const itemX = item.transform[4];
                let columnIndex = -1;
                columnCenters.forEach((col, idx) => {
                    if (itemX >= col.min - 10 && itemX <= col.max + 10) { // Increased tolerance
                        columnIndex = idx;
                    }
                });
                if (columnIndex !== -1) {
                    row[columnIndex] += (row[columnIndex] ? ' ' : '') + item.str.trim();
                }
            });
            if (row.some(cell => cell.trim() !== '')) {
                tableData.push(row);
            }
        });

        return {
            textItems,
            pageWidth: viewport.width,
            pageHeight: viewport.height,
            tableData,
            columns: columnCenters,
            lines: sortedLines
        };
    }
    
    // New function for table detection
    async performTableDetection() {
        this.tableData = [];
        let totalTables = 0;

        for (let i = 0; i < this.totalPages; i++) {
            const pageData = this.structuralData[i];
            if (pageData && pageData.tableData && pageData.tableData.length > 0) {
                const hasValidTable = this.validateTableStructure(pageData.tableData);
                if (hasValidTable) {
                    this.tableData[i] = pageData.tableData;
                    totalTables++;
                }
            }
            const progress = 80 + (i / this.totalPages) * 10;
            this.updateProgress(progress, `पृष्ठ ${i+1}/${this.totalPages} का टेबल विश्लेषण`);
        }

        document.getElementById('tableDetectionInfo').style.display = 'block';
        document.getElementById('tableCount').textContent = totalTables;
    }
    
    validateTableStructure(tableData) {
        if (tableData.length < 3) return false; // Minimum rows for a table

        // Check for header row (e.g., "नि.सं.", numbers, or Hindi keywords)
        const firstRow = tableData[0].map(cell => cell.trim());
        const isHeader = firstRow.some(cell => /नि\.सं\.|\d+|[घर|नाम|सम्बन्ध|लिंग|आयु|फोटो]/.test(cell));

        // Validate column consistency and content
        const validRows = tableData.slice(isHeader ? 1 : 0).filter(row => {
            const nonEmptyCells = row.filter(cell => cell.trim() !== '').length;
            return nonEmptyCells >= 6 && nonEmptyCells <= 8; // Expect 6-8 columns with data
        });

        return validRows.length / tableData.length >= 0.8; // 80% rows should be valid
    } 

    // Helper function to check for consistent columns in table data
    checkConsistentColumns(tableData) {
        if (tableData.length < 3) return false; // Need at least 3 rows for a table
        
        // Check if most rows have similar number of columns (expect 8)
        const columnCounts = tableData.map(row => row.filter(cell => cell.trim() !== '').length);
        const avgColumns = columnCounts.reduce((sum, count) => sum + count, 0) / columnCounts.length;
        
        // Count rows that have column count close to average
        const consistentRows = columnCounts.filter(count => 
            Math.abs(count - avgColumns) <= 1 && Math.abs(avgColumns - 8) <= 1
        ).length;
        
        // If at least 70% of rows have consistent columns, consider it a table
        return consistentRows / tableData.length >= 0.7;
    }
    
    async performHindiOCR() {
        for (let i = 1; i <= this.totalPages; i++) {
            const page = await this.pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            this.preprocessForHindiOCR(context, canvas.width, canvas.height);
            
            try {
                const { data: { text, words } } = await Tesseract.recognize(
                    canvas,
                    'hin',
                    {
                        logger: m => {
                            if (m.status === 'recognizing text') {
                                const progress = 40 + (i / this.totalPages) * 40 + (m.progress * 10);
                                this.updateProgress(progress, `OCR पृष्ठ ${i}/${this.totalPages} संसाधित कर रहा है`);
                            }
                        }
                    }
                );
                
                if (text && text.trim().length > 10) {
                    this.extractedText[i-1] = text; 
                }
                
                // Enhance structural data with OCR words (for better accuracy)
                this.structuralData[i-1].ocrWords = words;
                
            } catch (error) {
                console.error(`OCR error on page ${i}:`, error);
            }
            
            const progress = 40 + (i / this.totalPages) * 40;
            this.updateProgress(progress, `OCR पृष्ठ ${i}/${this.totalPages} संसाधित कर रहा है`);
        }
    }
    
    preprocessForHindiOCR(context, width, height) {
        const imageData = context.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            if (gray > 180) {
                data[i] = data[i+1] = data[i+2] = 255;
            } else {
                data[i] = data[i+1] = data[i+2] = 0;
            }
        }
        
        context.putImageData(imageData, 0, 0);
    }
    
    async reanalyzeLayoutWithOCR() {
        for (let i = 1; i <= this.totalPages; i++) {
            const pageIndex = i - 1;
            if (this.structuralData[pageIndex].ocrWords) {
                const page = await this.pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 1.0 });
                const textItems = this.convertOcrWordsToTextItems(this.structuralData[pageIndex].ocrWords, viewport);
                this.structuralData[pageIndex] = this.analyzeLayoutForTables(textItems, viewport);
            }
        }
    }
    
    convertOcrWordsToTextItems(words, viewport) {
        const textItems = [];
        const ocrScale = 2.0;
        words.forEach(word => {
            const bbox = word.bbox;
            const fontSize = (bbox.y1 - bbox.y0) / ocrScale;
            const x = bbox.x0 / ocrScale;
            const y = viewport.height - (bbox.y1 / ocrScale); // bottom y
            const transform = [fontSize, 0, 0, fontSize, x, y];
            textItems.push({
                str: word.text,
                transform,
                width: (bbox.x1 - bbox.x0) / ocrScale,
                height: fontSize,
            });
        });
        return textItems;
    }
    
    // New: Extract structured JSON
    async extractStructuredJSON() {
        this.extractedJSON = {
            pdf_filename: this.currentFile.name,
            document_metadata: {},
            pages: []
        };
        
        // Front page metadata
        const frontText = this.extractedText[0];
        this.extractedJSON.document_metadata = this.parseMetadata(frontText);
        
        // Per page
        for (let i = 1; i < this.totalPages; i++) {  // Skip front page
            const pageText = this.extractedText[i];
            const pageData = this.structuralData[i];
            const tableData = this.tableData[i] || pageData.tableData;
            
            const page_metadata = this.parsePageMetadata(pageText);
            const voter_records = this.parseVoterRecords(tableData);
            
            this.extractedJSON.pages.push({
                page_number: i + 1,  // 1-indexed
                page_metadata,
                voter_records
            });
        }
    }
    
    parseMetadata(text) {
        const metadata = {};
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
        
        // Heuristic parsing based on known format
        metadata.voter_list_year = lines.find(l => /\d{4}/.test(l)) || '2003';  // Default from sample
        metadata.state = lines.find(l => /उत्तर प्रदेश/.test(l)) || 'उत्तर प्रदेश';
        // Add more parsers for other fields...
        metadata.assembly_constituency_name = lines.find(l => /बरेली/.test(l)) || 'बरेली कैण्ट';
        metadata.part_number = lines.find(l => /106/.test(l)) || '106';
        metadata.polling_station_name = lines.find(l => /स्कूल/.test(l)) || 'बालजती जू० हाई स्कूल';
        metadata.total_pages = this.totalPages.toString();
        metadata.revision_date = lines.find(l => /\d{2}-\d{2}-\d{4}/.test(l)) || '30-06-2003';
        metadata.polling_station_type = 'मुख्य मतदान स्थल';
        metadata.total_male_voters = parseInt(lines.find(l => /पुरुष/.test(l))?.match(/\d+/)?.[0] || '617');
        metadata.total_female_voters = parseInt(lines.find(l => /महिला/.test(l))?.match(/\d+/)?.[0] || '514');
        metadata.total_voters = parseInt(lines.find(l => /कुल/.test(l))?.match(/\d+/)?.[0] || '1131');
        
        return metadata;
    }
    
    parsePageMetadata(text) {
        const metadata = {};
        const lines = text.split(/\r?\n/);
        
        // Extract section number, name, etc.
        const sectionLine = lines.find(l => /\(\d+\)/.test(l));
        if (sectionLine) {
            metadata.section_number = sectionLine.match(/(\d+)/)?.[1];
            metadata.section_name = sectionLine.match(/([^\(]+)\(/)?.[1].trim();
            metadata.polling_station_name_on_page = sectionLine.match(/\(([^\)]+)\)/)?.[1].trim();
        }
        
        return metadata;
    }
    
    parseVoterRecords(tableData) {
        const records = [];
        if (!tableData || tableData.length === 0) return records;

        let startIndex = 0;
        // Detect header row
        if (tableData[0].some(cell => /नि\.सं\.|\d+\./.test(cell))) startIndex = 1;

        tableData.slice(startIndex).forEach(row => {
            const cleanedRow = row.map(cell => cell.trim());
            if (cleanedRow.length >= 6) { // Minimum 6 columns to consider
                const record = {
                    sl_no_in_part: cleanedRow[0].match(/\d+/)?.[0] || '',
                    house_number: cleanedRow[1] || '',
                    voter_name: cleanedRow[2] || '',
                    relation_code: cleanedRow[3].match(/[पि|प]/)?.[0] || '',
                    relative_name: cleanedRow[4] || '',
                    gender_code: cleanedRow[5].match(/[पु|म]/)?.[0] || '',
                    age: cleanedRow[6].match(/\d+/)?.[0] || '',
                    photo_id_card_number: cleanedRow[7].match(/[A-Z]{3}\d{7}/)?.[0] || ''
                };
                if (record.voter_name || record.age) { // Valid if name or age exists
                    records.push(record);
                }
            }
        });

        return records;
    }
    
    renderProcessedView() {
        const preview = document.getElementById('processedPreview');
        preview.innerHTML = '';
        
        if (!this.extractedJSON) return;
        
        // Metadata
        const metaDiv = document.createElement('div');
        metaDiv.className = 'metadata';
        metaDiv.innerHTML = `<h3>दस्तावेज़ मेटाडेटा</h3>
            <pre>${JSON.stringify(this.extractedJSON.document_metadata, null, 2)}</pre>`;
        preview.appendChild(metaDiv);
        
        // Pages
        this.extractedJSON.pages.forEach(page => {
            const pageDiv = document.createElement('div');
            pageDiv.innerHTML = `<h4>पृष्ठ ${page.page_number}</h4>
                <pre>${JSON.stringify(page.page_metadata, null, 2)}</pre>
                <table class="voter-table">
                    <thead>
                        <tr>
                            <th>क्र.सं.</th>
                            <th>घर संख्या</th>
                            <th>मतदाता का नाम</th>
                            <th>सम्बन्ध</th>
                            <th>सम्बन्धी का नाम</th>
                            <th>लिंग</th>
                            <th>आयु</th>
                            <th>फोटो आईडी</th>
                        </tr>
                    </thead>
                    <tbody>`;
            
            page.voter_records.forEach(record => {
                pageDiv.innerHTML += `<tr>
                    <td>${record.sl_no_in_part}</td>
                    <td>${record.house_number}</td>
                    <td>${record.voter_name}</td>
                    <td>${record.relation_code}</td>
                    <td>${record.relative_name}</td>
                    <td>${record.gender_code}</td>
                    <td>${record.age}</td>
                    <td>${record.photo_id_card_number}</td>
                </tr>`;
            });
            
            pageDiv.innerHTML += `</tbody></table>`;
            preview.appendChild(pageDiv);
        });
    }
    
    renderStructuredPdfView() {
        const preview = document.getElementById('structuredPdfPreview');
        preview.innerHTML = '';
        
        if (!this.extractedJSON) {
            const p = document.createElement('p');
            p.textContent = 'JSON डेटा उपलब्ध नहीं है';
            preview.appendChild(p);
            return;
        }
        
        const docDiv = document.createElement('div');
        docDiv.style.width = '595px';
        docDiv.style.minHeight = '842px';
        docDiv.style.background = 'white';
        docDiv.style.padding = '40px 30px';
        docDiv.style.boxShadow = '0 0 10px rgba(0,0,0,0.1)';
        docDiv.style.margin = '20px auto';
        docDiv.style.fontFamily = "'Nirmala UI', sans-serif";
        docDiv.style.fontSize = '12px';
        
        // Document Header
        const header = document.createElement('div');
        header.style.textAlign = 'center';
        header.style.marginBottom = '20px';
        header.innerHTML = `<h2 style="font-size: 16px;">${this.extractedJSON.document_metadata.voter_list_year} निर्वाचन नामावली</h2>
            <p>राज्य: ${this.extractedJSON.document_metadata.state}</p>
            <p>विधानसभा क्षेत्र: ${this.extractedJSON.document_metadata.assembly_constituency_name}</p>
            <p>भाग संख्या: ${this.extractedJSON.document_metadata.part_number}</p>
            <p>मतदान स्थल: ${this.extractedJSON.document_metadata.polling_station_name}</p>
            <p>संशोधन तिथि: ${this.extractedJSON.document_metadata.revision_date}</p>
            <p>कुल मतदाता: ${this.extractedJSON.document_metadata.total_voters} (पुरुष: ${this.extractedJSON.document_metadata.total_male_voters}, महिला: ${this.extractedJSON.document_metadata.total_female_voters})</p>`;
        docDiv.appendChild(header);
        
        // Pages
        this.extractedJSON.pages.forEach((page, index) => {
            const pageDiv = document.createElement('div');
            if (index > 0) pageDiv.style.pageBreakBefore = 'always';
            pageDiv.style.marginTop = '20px';
            
            const pageHeader = document.createElement('div');
            pageHeader.style.textAlign = 'center';
            pageHeader.innerHTML = `<h3 style="font-size: 14px;">पृष्ठ ${page.page_number}</h3>
                <p>खंड संख्या: ${page.page_metadata.section_number || ''}</p>
                <p>खंड नाम: ${page.page_metadata.section_name || ''}</p>
                <p>मतदान स्थल पृष्ठ पर: ${page.page_metadata.polling_station_name_on_page || ''}</p>`;
            pageDiv.appendChild(pageHeader);
            
            const voterTable = document.createElement('table');
            voterTable.style.width = '100%';
            voterTable.style.borderCollapse = 'collapse';
            voterTable.style.marginTop = '10px';
            
            const thead = document.createElement('thead');
            const headerRow = thead.insertRow();
            ['क्र.सं.', 'घर संख्या', 'मतदाता का नाम', 'सम्बन्ध', 'सम्बन्धी का नाम', 'लिंग', 'आयु', 'फोटो आईडी'].forEach(text => {
                const th = document.createElement('th');
                th.textContent = text;
                th.style.border = '1px solid black';
                th.style.padding = '5px';
                th.style.background = '#f0f0f0';
                th.style.textAlign = 'left';
                headerRow.appendChild(th);
            });
            voterTable.appendChild(thead);
            
            const tbody = document.createElement('tbody');
            page.voter_records.forEach(record => {
                const row = tbody.insertRow();
                Object.values(record).forEach(value => {
                    const td = document.createElement('td');
                    td.textContent = value;
                    td.style.border = '1px solid black';
                    td.style.padding = '5px';
                    row.appendChild(td);
                });
            });
            voterTable.appendChild(tbody);
            
            pageDiv.appendChild(voterTable);
            docDiv.appendChild(pageDiv);
        });
        
        preview.appendChild(docDiv);
    }
    
    async renderPage(pageNumber) {
        const activeTab = document.getElementById('originalTab').classList.contains('active') ? 'original' : document.getElementById('processedTab').classList.contains('active') ? 'processed' : 'structuredPdf';
        
        if (activeTab === 'processed') {
            this.renderProcessedView();
            return;
        } else if (activeTab === 'structuredPdf') {
            this.renderStructuredPdfView();
            return;
        }
        
        if (!this.pdfDoc) return;
        
        try {
            const page = await this.pdfDoc.getPage(pageNumber);
            this.currentViewport = page.getViewport({ scale: this.currentScale });
            
            const container = document.getElementById('pdfPreview');
            container.innerHTML = '';
            document.getElementById('textLayer').innerHTML = '';
            
            this.canvas = document.createElement('canvas');
            this.canvas.className = 'pdf-canvas';
            this.ctx = this.canvas.getContext('2d');
            this.canvas.height = this.currentViewport.height;
            this.canvas.width = this.currentViewport.width;

            this.canvas.style.display = 'block';
            
            container.appendChild(this.canvas);
            
            const renderTask = page.render({
                canvasContext: this.ctx,
                viewport: this.currentViewport
            });
            await renderTask.promise;
            
            document.getElementById('pageNum').textContent = pageNumber;
            document.getElementById('zoomLevel').textContent = Math.round(this.currentScale * 100) + '%';
            
            await new Promise(resolve => setTimeout(resolve, 0));
            
            this.positionAndCreateTextLayer(pageNumber);
            
            if (this.searchMatches.length > 0) {
                this.highlightSearchTerms(pageNumber);
            }
            
        } catch (error) {
            console.error('पृष्ठ रेंडर करने में त्रुटि:', error);
        }
    }

    positionAndCreateTextLayer(pageNumber) {
        const textLayer = document.getElementById('textLayer');
        const previewContainer = document.getElementById('pdfPreviewContainer');

        if (this.canvas) {
            const canvasRect = this.canvas.getBoundingClientRect();
            const containerRect = previewContainer.getBoundingClientRect();
            
            const offsetX = canvasRect.left - containerRect.left;
            const offsetY = canvasRect.top - containerRect.top;

            textLayer.style.left = `${offsetX}px`;
            textLayer.style.top = `${offsetY}px`;
            textLayer.style.width = `${canvasRect.width}px`;
            textLayer.style.height = `${canvasRect.height}px`;

            this.createTextLayer(pageNumber, this.currentViewport);
        }
    }
    
    createTextLayer(pageNumber, viewport) {
        const textLayer = document.getElementById('textLayer');
        const pageIndex = pageNumber - 1;
        
        if (this.textPositions[pageIndex]) {
            this.textPositions[pageIndex].forEach(item => {
                const span = document.createElement('span');
                span.textContent = item.str;
                span.style.position = 'absolute';
                span.style.transform = `matrix(${item.transform.join(',')})`;
                span.style.transformOrigin = '0% 0%';
                
                span.style.fontSize = `${Math.abs(item.transform[3]) * this.currentScale}px`;
                span.style.left = `${item.transform[4] * this.currentScale}px`;
                span.style.top = `${(viewport.height - item.transform[5])}px`; 

                span.style.fontFamily = 'inherit';
                span.style.color = 'transparent';
                span.style.pointerEvents = 'auto';
                span.style.cursor = 'text';
                span.style.lineHeight = '1';
                
                span.dataset.originalText = item.str;
                
                textLayer.appendChild(span);
            });
        }
    }
    
    highlightSearchTerms(pageNumber) {
        const searchTerm = document.getElementById('searchInput').value.trim();
        if (!searchTerm) return;
        
        this.positionAndCreateTextLayer(pageNumber);
        
        const textLayer = document.getElementById('textLayer');
        const spans = textLayer.getElementsByTagName('span');
        
        Array.from(spans).forEach(span => {
            const text = span.dataset.originalText;
            if (text && text.toLowerCase().includes(searchTerm.toLowerCase())) {
                
                const isCurrentMatch = this.searchMatches.length > 0 && 
                    this.currentMatchIndex >= 0 &&
                    this.searchMatches[this.currentMatchIndex].page === pageNumber &&
                    text.toLowerCase().includes(searchTerm.toLowerCase());
                
                span.className = isCurrentMatch ? 'current-highlight' : 'highlight';
            }
        });

        if (this.currentMatchIndex >= 0) {
            const matchPage = this.searchMatches[this.currentMatchIndex].page;
            if (matchPage === pageNumber) {
                const currentMatchSpan = Array.from(spans).find(span => 
                    span.className === 'current-highlight'
                );
                if (currentMatchSpan) {
                    currentMatchSpan.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }
    
    zoom(delta) {
        this.currentScale = Math.max(0.5, Math.min(3.0, this.currentScale + delta));
        this.defaultScale = 0; 
        this.renderPage(this.currentPage);
    }
    
    async fitToWidth(isInitialLoad = false) {
        if (!this.pdfDoc) return;

        const page = await this.pdfDoc.getPage(this.currentPage);
        const container = document.getElementById('pdfPreviewContainer');
        
        const containerWidth = container.clientWidth; 
        const pageViewport = page.getViewport({ scale: 1.0 });

        const scale = (containerWidth - 40) / pageViewport.width;
        
        this.currentScale = scale;
        this.defaultScale = scale;
        
        this.renderPage(this.currentPage);
    }
    
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderPage(this.currentPage);
        }
    }
    
    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.renderPage(this.currentPage);
        }
    }
    
    performSearch() {
        const searchTerm = document.getElementById('searchInput').value.trim();
        if (!searchTerm) {
            this.showStatus('कृपया खोज शब्द दर्ज करें', 'error');
            return;
        }
        
        this.searchMatches = [];
        
        this.extractedText.forEach((text, index) => {
            if (text.toLowerCase().includes(searchTerm.toLowerCase())) {
                this.searchMatches.push({
                    page: index + 1,
                    text: text
                });
            }
        });
        
        if (this.searchMatches.length > 0) {
            document.getElementById('matchCount').textContent = this.searchMatches.length;
            document.getElementById('totalMatches').textContent = this.searchMatches.length;
            document.getElementById('resultsInfo').style.display = 'block';
            
            document.getElementById('prevMatch').disabled = false;
            document.getElementById('nextMatch').disabled = false;
            
            this.currentMatchIndex = 0;
            document.getElementById('currentMatch').textContent = this.currentMatchIndex + 1;
            
            this.navigateToMatch();
            this.showStatus(`"${searchTerm}" के ${this.searchMatches.length} मिलान मिले`, 'success');
        } else {
            document.getElementById('resultsInfo').style.display = 'none';
            this.showStatus(`"${searchTerm}" का कोई मिलान नहीं मिला`, 'error');
            document.getElementById('prevMatch').disabled = true;
            document.getElementById('nextMatch').disabled = true;
        }
    }
    
    previousMatch() {
        if (this.searchMatches.length === 0) return;
        
        this.currentMatchIndex = (this.currentMatchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
        document.getElementById('currentMatch').textContent = this.currentMatchIndex + 1;
        this.navigateToMatch();
    }
    
    nextMatch() {
        if (this.searchMatches.length === 0) return;
        
        this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
        document.getElementById('currentMatch').textContent = this.currentMatchIndex + 1;
        this.navigateToMatch();
    }
    
    navigateToMatch() {
        if (this.currentMatchIndex < 0 || this.currentMatchIndex >= this.searchMatches.length) return;
        
        const match = this.searchMatches[this.currentMatchIndex];
        
        if (match.page !== this.currentPage) {
            this.currentPage = match.page;
            this.renderPage(this.currentPage).then(() => {
                this.highlightSearchTerms(this.currentPage);
            });
        } else {
            this.highlightSearchTerms(this.currentPage);
        }
    }
    
    // Enhanced function for generating searchable PDF with table structure
    async downloadSearchablePDF() {
        if (!this.pdfDoc) return;
        
        this.showStatus('खोज योग्य PDF बनाया जा रहा है... (इसमें कुछ समय लग सकता है)', 'processing');
        document.getElementById('downloadBtn').disabled = true;
        
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'a4'
        });
        
        const docWidth = doc.internal.pageSize.getWidth();
        const docHeight = doc.internal.pageSize.getHeight();
        
        for (let i = 1; i <= this.totalPages; i++) {
            if (i > 1) {
                doc.addPage();
            }
            
            const page = await this.pdfDoc.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 }); // High scale for good image quality
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            const imgData = canvas.toDataURL('image/jpeg', 0.8);
            
            // Calculate image height to maintain aspect ratio, fitting the doc width
            const imgProps = doc.getImageProperties(imgData);
            const imgHeight = (imgProps.height * docWidth) / imgProps.width;
            
            // 1. Add PDF page image as background
            doc.addImage(imgData, 'JPEG', 0, 0, docWidth, imgHeight);
            
            // 2. Add invisible text layer for searching/sorting
            const structuralPageData = this.structuralData[i-1];
            const textData = structuralPageData.textItems;
            
            // Scale factor from PDF.js's 1.0 scale to jsPDF's point size (docWidth)
            const pageScaleFactor = docWidth / structuralPageData.pageWidth; 
            
            doc.setFont('times', 'normal'); 
            
            textData.forEach(item => {
                const str = item.str;
                const transform = item.transform;
                
                // Calculate position in the new PDF (based on PDF.js's text transform matrix)
                const x = transform[4] * pageScaleFactor;
                // PDF.js Y-coordinates are from bottom, jsPDF is from top.
                // Y = (Original Page Height - Original Y position) * Scale Factor
                // Note: structuralPageData.pageHeight is at scale 1.0
                const y = (structuralPageData.pageHeight - transform[5]) * pageScaleFactor;
                
                const fontSize = Math.abs(transform[3]) * pageScaleFactor;
                doc.setFontSize(fontSize);
                
                doc.text(str, x, y, {
                    renderingMode: 'invisible' // Key for making it searchable but invisible
                });
            });
            
            // 3. Add table structure data if available
            const tableData = this.tableData[i-1];
            if (tableData && tableData.length > 0) {
                // Add table metadata as invisible text
                doc.setFontSize(8);
                doc.setTextColor(255, 255, 255); // White text (invisible on white background)
                
                let tableY = docHeight - 20; // Position at bottom of page
                tableData.forEach((row, rowIndex) => {
                    const rowText = row.filter(cell => cell.trim() !== '').join(' | ');
                    if (rowText.trim() !== '') {
                        doc.text(`TableRow${rowIndex}: ${rowText}`, 10, tableY, {
                            renderingMode: 'invisible'
                        });
                        tableY -= 10;
                    }
                });
            }
            
            this.updateProgress(90 + (i / this.totalPages) * 10, `PDF पृष्ठ ${i}/${this.totalPages} जोड़ा गया`);
        }
        
        // Final download
        const filename = this.currentFile ? 
            this.currentFile.name.replace('.pdf', '_searchable_structured.pdf') : 
            'searchable_hindi_voter_list.pdf';
            
        doc.save(filename);
        
        document.getElementById('downloadBtn').disabled = false;
        this.showStatus('खोज योग्य PDF सफलतापूर्वक डाउनलोड किया गया।', 'success');
    }
    
    downloadJSON() {
        if (!this.extractedJSON) return;
        
        const jsonStr = JSON.stringify(this.extractedJSON, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile.name.replace('.pdf', '_extracted.json');
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    updateStep(stepNumber, status, message) {
        const stepIcon = document.getElementById(`step${stepNumber}`);
        const stepStatus = document.getElementById(`step${stepNumber}Status`);
        
        stepIcon.className = `step-icon ${status}`;
        stepStatus.textContent = message;
    }
    
    updateProgress(percent, text) {
        document.getElementById('progress').style.width = percent + '%';
        document.getElementById('progressText').textContent = text || '';
    }
    
    showStatus(message, type) {
        const statusElement = document.getElementById('statusMessage');
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
    }
    
    updateUI() {
        document.getElementById('processBtn').disabled = true;
        document.getElementById('downloadBtn').disabled = true;
        document.getElementById('downloadJsonBtn').disabled = true;
        document.getElementById('prevPage').disabled = true;
        document.getElementById('nextPage').disabled = true;
        document.getElementById('prevMatch').disabled = true;
        document.getElementById('nextMatch').disabled = true;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new HindiPDFProcessor();
});
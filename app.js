
// DOM Elements
const totalMemoryInput = document.getElementById('totalMemory');
const blockSizeInput = document.getElementById('blockSize');
const blockSizeLabel = document.getElementById('blockSizeLabel');
const blockSizeTooltip = document.getElementById('blockSizeTooltip');
const algorithmSelect = document.getElementById('algorithm');
const initMemoryBtn = document.getElementById('initMemory');
const processSizeInput = document.getElementById('processSize');
const addProcessBtn = document.getElementById('addProcess');
const randomProcessesBtn = document.getElementById('randomProcesses');
const memoryGrid = document.getElementById('memoryGrid');
const processList = document.getElementById('processList');
const pageSegmentSettings = document.getElementById('pageSegmentSettings');
const processSegmentForm = document.getElementById('processSegmentForm');

// Memory type buttons
const contiguousBtn = document.getElementById('contiguousBtn');
const pagingBtn = document.getElementById('pagingBtn');
const segmentationBtn = document.getElementById('segmentationBtn');
const currentMemoryType = document.getElementById('currentMemoryType');
const memoryTypeBadge = document.getElementById('memoryTypeBadge');

// Stats Elements
const utilizationProgress = document.getElementById('utilizationProgress');
const utilizationValue = document.getElementById('utilizationValue');
const usedMemoryProgress = document.getElementById('usedMemoryProgress');
const usedMemoryValue = document.getElementById('usedMemoryValue');
const activeProcessesEl = document.getElementById('activeProcesses');
const fragmentationEl = document.getElementById('fragmentation');
const pagesBox = document.getElementById('pagesBox');
const pageCount = document.getElementById('pageCount');
const segmentsBox = document.getElementById('segmentsBox');
const segmentCount = document.getElementById('segmentCount');

// Pagination elements
const memoryPagination = document.getElementById('memoryPagination');
const processListPagination = document.getElementById('processListPagination');

// Settings for item pagination
const itemsPerPage = 20;
let currentMemoryPage = 1;
let currentProcessPage = 1;
let totalMemoryPages = 1;
let totalProcessPages = 1;

// Initialize the app
function init() {
    // Set initial values
    MemoryManager.totalMemory = parseInt(totalMemoryInput.value);
    MemoryManager.blockSize = parseInt(blockSizeInput.value);
    MemoryManager.algorithm = algorithmSelect.value;
    MemoryManager.memoryType = 'contiguous';
    MemoryManager.itemsPerPage = itemsPerPage;

    // Initialize memory
    MemoryManager.initializeMemory();

    // Render the initial state
    renderMemory();
    updateStats();
    updatePageSegmentSettings();

    // Add event listeners
    initMemoryBtn.addEventListener('click', handleInitMemory);
    addProcessBtn.addEventListener('click', handleAddProcess);
    randomProcessesBtn.addEventListener('click', handleRandomProcesses);

    // Memory settings change listeners
    totalMemoryInput.addEventListener('change', validateSettings);
    blockSizeInput.addEventListener('change', validateSettings);

    algorithmSelect.addEventListener('change', () => {
        MemoryManager.algorithm = algorithmSelect.value;
    });

    // Memory type buttons
    contiguousBtn.addEventListener('click', () => setMemoryType('contiguous'));
    pagingBtn.addEventListener('click', () => setMemoryType('paging'));
    segmentationBtn.addEventListener('click', () => setMemoryType('segmentation'));

    setMemoryType('contiguous');
}

// Validate memory settings
function validateSettings() {
    const newTotalMemory = parseInt(totalMemoryInput.value);
    const newBlockSize = parseInt(blockSizeInput.value);

    if (MemoryManager.memoryType === 'paging') {
        const newPageSize = newBlockSize;
        if (newTotalMemory < newPageSize) {
            alert('Total memory must be greater than page size');
            blockSizeInput.value = MemoryManager.pageSize;
            return false;
        }
    } else {
        if (newTotalMemory < newBlockSize) {
            alert('Total memory must be greater than block size');
            blockSizeInput.value = MemoryManager.blockSize;
            return false;
        }
    }

    return true;
}

// Set memory type (contiguous, paging, segmentation)
function setMemoryType(type) {
    MemoryManager.memoryType = type;

    // Update UI to reflect the memory type
    contiguousBtn.classList.toggle('btn-secondary', type === 'contiguous');
    pagingBtn.classList.toggle('btn-secondary', type === 'paging');
    segmentationBtn.classList.toggle('btn-secondary', type === 'segmentation');

    currentMemoryType.textContent = type.charAt(0).toUpperCase() + type.slice(1);

    // Update labels and settings based on memory type
    if (type === 'paging') {
        blockSizeLabel.textContent = 'Page Size (KB):';
        blockSizeTooltip.textContent = 'Size of individual memory pages';
        memoryTypeBadge.className = 'memory-type-badge paging';
        memoryTypeBadge.textContent = 'Paged Memory';
        pagesBox.style.display = 'block';
        segmentsBox.style.display = 'none';

        // Set page size to a more reasonable value if needed
        if (parseInt(blockSizeInput.value) > 64) {
            blockSizeInput.value = 16;
        }
    } else if (type === 'segmentation') {
        blockSizeLabel.textContent = 'Block Size (KB):';
        blockSizeTooltip.textContent = 'Size of memory allocation blocks';
        memoryTypeBadge.className = 'memory-type-badge segmentation';
        memoryTypeBadge.textContent = 'Segmented Memory';
        pagesBox.style.display = 'none';
        segmentsBox.style.display = 'block';
    } else {
        blockSizeLabel.textContent = 'Block Size (KB):';
        blockSizeTooltip.textContent = 'Size of contiguous memory blocks';
        memoryTypeBadge.className = 'memory-type-badge contiguous';
        memoryTypeBadge.textContent = 'Contiguous Memory';
        pagesBox.style.display = 'none';
        segmentsBox.style.display = 'none';
    }

    updatePageSegmentSettings();

    // Return to the default process form when memory type changes
    processSegmentForm.style.display = 'none';
    processSizeInput.parentElement.style.display = 'block';
}

// Update additional settings for page/segment options
function updatePageSegmentSettings() {
    pageSegmentSettings.innerHTML = '';

    if (MemoryManager.memoryType === 'paging') {
        const pageSize = parseInt(blockSizeInput.value);
        MemoryManager.pageSize = pageSize;

        const totalPages = Math.floor(MemoryManager.totalMemory / pageSize);

        const pagingInfo = document.createElement('div');
        pagingInfo.className = 'alert alert-info';
        pagingInfo.innerHTML = `
      <span class="alert-icon"><i class="fas fa-info-circle"></i></span>
      <span>Total Pages: ${totalPages} (${pageSize} KB each)</span>
    `;
        pageSegmentSettings.appendChild(pagingInfo);
    } else if (MemoryManager.memoryType === 'segmentation') {
        const segmentationInfo = document.createElement('div');
        segmentationInfo.className = 'alert alert-info';
        segmentationInfo.innerHTML = `
      <span class="alert-icon"><i class="fas fa-info-circle"></i></span>
      <span>Create process segments when adding a process</span>
    `;
        pageSegmentSettings.appendChild(segmentationInfo);
    }
}

// Handle memory initialization
function handleInitMemory() {
    if (!validateSettings()) {
        return;
    }

    const newTotalMemory = parseInt(totalMemoryInput.value);
    const newBlockOrPageSize = parseInt(blockSizeInput.value);
    const newAlgorithm = algorithmSelect.value;

    MemoryManager.totalMemory = newTotalMemory;

    if (MemoryManager.memoryType === 'paging') {
        MemoryManager.pageSize = newBlockOrPageSize;
    } else {
        MemoryManager.blockSize = newBlockOrPageSize;
    }

    MemoryManager.algorithm = newAlgorithm;

    MemoryManager.initializeMemory();

    // Reset pagination
    currentMemoryPage = 1;
    currentProcessPage = 1;

    renderMemory();
    renderProcessList();
    updateStats();
    updatePageSegmentSettings();

    // Add animation class
    memoryGrid.classList.add('memory-block-enter');
    setTimeout(() => {
        memoryGrid.classList.remove('memory-block-enter');
    }, 400);
}

// Handle process addition
function handleAddProcess() {
    let processSize, segments;

    if (MemoryManager.memoryType === 'segmentation' && processSegmentForm.style.display !== 'none') {
        // Get segments from the form
        segments = [];
        const segmentForms = processSegmentForm.querySelectorAll('.segment-entry');

        segmentForms.forEach(form => {
            const nameInput = form.querySelector('.segment-name');
            const sizeInput = form.querySelector('.segment-size');

            const name = nameInput.value.trim();
            const size = parseInt(sizeInput.value);

            if (name && !isNaN(size) && size > 0) {
                segments.push({ name, size });
            }
        });

        if (segments.length === 0) {
            alert('Please add at least one valid segment');
            return;
        }

        processSize = segments.reduce((total, segment) => total + segment.size, 0);
    } else {
        // Standard process size
        processSize = parseInt(processSizeInput.value);

        if (isNaN(processSize) || processSize <= 0) {
            alert('Please enter a valid process size');
            return;
        }
    }

    let result;
    if (MemoryManager.memoryType === 'segmentation' && segments) {
        result = MemoryManager.allocateMemory(processSize, segments);
    } else {
        result = MemoryManager.allocateMemory(processSize);
    }

    if (!result.success) {
        alert('Not enough memory to allocate this process');
        return;
    }

    // If we have multiple pages of processes, go to the last page
    if (MemoryManager.processes.length > itemsPerPage) {
        currentProcessPage = Math.ceil(MemoryManager.processes.length / itemsPerPage);
    }

    renderMemory();
    renderProcessList();
    updateStats();
}

// Handle random process generation
function handleRandomProcesses() {
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 random processes

    for (let i = 0; i < count; i++) {
        const size = Math.floor(Math.random() * 128) + 32; // 32-160 KB

        if (MemoryManager.memoryType === 'segmentation') {
            // For segmentation, create 1-3 random segments
            const segmentCount = Math.floor(Math.random() * 3) + 1;
            const segments = [];

            // Distribute the total size among segments
            let remainingSize = size;

            for (let j = 0; j < segmentCount; j++) {
                const isLast = j === segmentCount - 1;
                const segmentSize = isLast
                    ? remainingSize
                    : Math.floor(remainingSize / (segmentCount - j) * Math.random() + remainingSize / (segmentCount - j) * 0.5);

                segments.push({
                    name: `Seg${j + 1}`,
                    size: segmentSize
                });

                remainingSize -= segmentSize;
            }

            const result = MemoryManager.allocateMemory(size, segments);
            if (!result.success) {
                break; // Stop if we can't allocate more
            }
        } else {
            const result = MemoryManager.allocateMemory(size);
            if (!result.success) {
                break; // Stop if we can't allocate more
            }
        }
    }

    // Update the view
    renderMemory();
    renderProcessList();
    updateStats();
}

// Handle process removal
function handleRemoveProcess(processId) {
    MemoryManager.deallocateMemory(processId);
    renderMemory();
    renderProcessList();
    updateStats();
}

// Toggle the segmentation form for adding process segments
function toggleSegmentForm() {
    if (MemoryManager.memoryType !== 'segmentation') {
        processSegmentForm.style.display = 'none';
        return;
    }

    if (processSegmentForm.style.display === 'none') {
        // Show segment form
        processSegmentForm.style.display = 'block';
        processSizeInput.parentElement.style.display = 'none';

        // Create initial segment input
        processSegmentForm.innerHTML = `
      <h4 style="margin-bottom: 0.5rem;">Process Segments</h4>
      <div class="segment-entries"></div>
      <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
        <button type="button" class="btn" id="addSegmentBtn" style="width: auto;">Add Segment</button>
        <button type="button" class="btn" id="useSimpleProcessBtn" style="width: auto;">Use Simple Process</button>
      </div>
    `;

        // Add a default segment
        addSegmentInput();

        // Add event listeners
        document.getElementById('addSegmentBtn').addEventListener('click', addSegmentInput);
        document.getElementById('useSimpleProcessBtn').addEventListener('click', () => {
            processSegmentForm.style.display = 'none';
            processSizeInput.parentElement.style.display = 'block';
        });
    } else {
        // Hide segment form
        processSegmentForm.style.display = 'none';
        processSizeInput.parentElement.style.display = 'block';
    }
}

// Add a segment input to the form
function addSegmentInput() {
    const segmentEntries = processSegmentForm.querySelector('.segment-entries');
    const segmentId = segmentEntries.children.length + 1;

    const segmentEntry = document.createElement('div');
    segmentEntry.className = 'segment-entry';
    segmentEntry.style.display = 'flex';
    segmentEntry.style.gap = '0.5rem';
    segmentEntry.style.marginBottom = '0.5rem';

    segmentEntry.innerHTML = `
    <div style="flex: 1;">
      <input type="text" class="segment-name" placeholder="Segment Name" value="Segment ${segmentId}">
    </div>
    <div style="flex: 1;">
      <input type="number" class="segment-size" placeholder="Size (KB)" value="64" min="1">
    </div>
    <button type="button" class="remove-segment" style="background: none; border: none; color: #ef4444; cursor: pointer;">
      <i class="fas fa-times"></i>
    </button>
  `;

    // Add remove button functionality
    segmentEntry.querySelector('.remove-segment').addEventListener('click', () => {
        segmentEntry.remove();
        // Re-number the segments
        const entries = segmentEntries.querySelectorAll('.segment-entry');
        entries.forEach((entry, index) => {
            const nameInput = entry.querySelector('.segment-name');
            if (nameInput.value.startsWith('Segment ')) {
                nameInput.value = `Segment ${index + 1}`;
            }
        });
    });

    segmentEntries.appendChild(segmentEntry);
}

// Render memory blocks with pagination
function renderMemory() {
    memoryGrid.innerHTML = '';

    // Determine if we need pagination
    const totalBlocks = MemoryManager.blocks.length;
    totalMemoryPages = Math.ceil(totalBlocks / itemsPerPage);

    // Show/hide pagination controls
    memoryPagination.style.display = totalMemoryPages > 1 ? 'flex' : 'none';

    // Get blocks for the current page
    const blocksToRender = totalMemoryPages > 1
        ? MemoryManager.getPagedBlocks(currentMemoryPage, itemsPerPage)
        : MemoryManager.blocks;

    // Update pagination
    if (totalMemoryPages > 1) {
        renderPagination(memoryPagination, currentMemoryPage, totalMemoryPages, (page) => {
            currentMemoryPage = page;
            renderMemory();
        });
    }

    // For paging and segmentation, group blocks differently
    if (MemoryManager.memoryType === 'paging') {
        renderPagedMemory(blocksToRender);
    } else if (MemoryManager.memoryType === 'segmentation') {
        renderSegmentedMemory(blocksToRender);
    } else {
        renderContiguousMemory(blocksToRender);
    }
}

// Render contiguous memory blocks
function renderContiguousMemory(blocks) {
    // Calculate the width of each block based on the total number
    const blockWidth = calculateBlockWidth(blocks.length);

    // Create and append memory blocks
    blocks.forEach(block => {
        const blockElement = document.createElement('div');
        blockElement.className = `memory-block ${block.isAllocated ? 'allocated' : 'free'}`;
        blockElement.style.width = `${blockWidth}px`;

        // Add process color if allocated
        if (block.isAllocated) {
            const process = MemoryManager.processes.find(p => p.id === block.processId);
            if (process) {
                blockElement.style.backgroundColor = process.color;
                blockElement.textContent = process.id;
            }
        } else {
            blockElement.textContent = `${block.startAddress}`;
        }

        // Add tooltip with block information
        blockElement.title = `Block ${block.id}\nAddress: ${block.startAddress}-${block.startAddress + (MemoryManager.blockSize) - 1}\nSize: ${MemoryManager.blockSize} KB\nStatus: ${block.isAllocated ? 'Allocated to ' + block.processId : 'Free'}`;

        memoryGrid.appendChild(blockElement);
    });
}

// Render paged memory visualization
function renderPagedMemory(blocks) {
    // Group blocks by process for a more visual representation
    const processes = MemoryManager.processes;
    const processGroups = {};
    const freePages = [];

    // Separate allocated and free pages
    blocks.forEach(block => {
        if (block.isAllocated) {
            if (!processGroups[block.processId]) {
                processGroups[block.processId] = [];
            }
            processGroups[block.processId].push(block);
        } else {
            freePages.push(block);
        }
    });

    // Render process pages first
    for (const processId in processGroups) {
        const process = processes.find(p => p.id === processId);
        if (!process) continue;

        const pageContainer = document.createElement('div');
        pageContainer.className = 'memory-page';

        const pageTitle = document.createElement('div');
        pageTitle.className = 'page-title';
        pageTitle.textContent = `${processId} (${process.size} KB)`;
        pageContainer.appendChild(pageTitle);

        const pagesGrid = document.createElement('div');
        pagesGrid.className = 'memory-grid';
        pagesGrid.style.display = 'flex';
        pagesGrid.style.flexWrap = 'wrap';
        pagesGrid.style.gap = '4px';
        pagesGrid.style.minHeight = 'auto';
        pagesGrid.style.background = 'transparent';
        pagesGrid.style.border = 'none';
        pagesGrid.style.padding = '0';

        // Calculate the width of each block
        const blockWidth = calculateBlockWidth(8); // Fixed width for better visuals

        processGroups[processId].forEach(block => {
            const blockElement = document.createElement('div');
            blockElement.className = 'memory-block allocated';
            blockElement.style.width = `${blockWidth}px`;
            blockElement.style.backgroundColor = process.color;

            // Page number/frame number display
            const pageTableEntry = MemoryManager.pageTableEntries.find(
                entry => entry.processId === processId && entry.physicalFrame === block.id
            );

            if (pageTableEntry) {
                blockElement.textContent = `P${pageTableEntry.logicalPage}`;
            } else {
                blockElement.textContent = `F${block.id}`;
            }

            // Add tooltip with page information
            blockElement.title = `Frame ${block.id}\nAddress: ${block.startAddress}-${block.startAddress + MemoryManager.pageSize - 1}\nSize: ${MemoryManager.pageSize} KB\nLogical Page: ${pageTableEntry ? pageTableEntry.logicalPage : 'N/A'}\nAllocated to: ${processId}`;

            pagesGrid.appendChild(blockElement);
        });

        pageContainer.appendChild(pagesGrid);
        memoryGrid.appendChild(pageContainer);
    }

    // Then render free pages
    if (freePages.length > 0) {
        const freePageContainer = document.createElement('div');
        freePageContainer.className = 'memory-page';
        freePageContainer.style.borderColor = '#9ca3af';
        freePageContainer.style.backgroundColor = 'rgba(156, 163, 175, 0.1)';

        const pageTitle = document.createElement('div');
        pageTitle.className = 'page-title';
        pageTitle.textContent = 'Free Pages';
        pageTitle.style.backgroundColor = '#9ca3af';
        freePageContainer.appendChild(pageTitle);

        const pagesGrid = document.createElement('div');
        pagesGrid.className = 'memory-grid';
        pagesGrid.style.display = 'flex';
        pagesGrid.style.flexWrap = 'wrap';
        pagesGrid.style.gap = '4px';
        pagesGrid.style.minHeight = 'auto';
        pagesGrid.style.background = 'transparent';
        pagesGrid.style.border = 'none';
        pagesGrid.style.padding = '0';

        // Calculate the width of each block
        const blockWidth = calculateBlockWidth(8); // Fixed width for better visuals

        freePages.forEach(block => {
            const blockElement = document.createElement('div');
            blockElement.className = 'memory-block free';
            blockElement.style.width = `${blockWidth}px`;
            blockElement.textContent = `F${block.id}`;

            // Add tooltip with page information
            blockElement.title = `Frame ${block.id}\nAddress: ${block.startAddress}-${block.startAddress + MemoryManager.pageSize - 1}\nSize: ${MemoryManager.pageSize} KB\nStatus: Free`;

            pagesGrid.appendChild(blockElement);
        });

        freePageContainer.appendChild(pagesGrid);
        memoryGrid.appendChild(freePageContainer);
    }
}

// Render segmented memory visualization
function renderSegmentedMemory(blocks) {
    // Group blocks by segment
    const segments = MemoryManager.segmentTable;
    const segmentGroups = {};
    const freeBlocks = [];

    // First collect all segments and free blocks
    blocks.forEach(block => {
        if (block.isAllocated && block.segmentId) {
            if (!segmentGroups[block.segmentId]) {
                segmentGroups[block.segmentId] = [];
            }
            segmentGroups[block.segmentId].push(block);
        } else {
            freeBlocks.push(block);
        }
    });

    // Group segments by process
    const processList = {};

    segments.forEach(segment => {
        if (!processList[segment.processId]) {
            processList[segment.processId] = [];
        }
        processList[segment.processId].push(segment);
    });

    // Render segments for each process
    for (const processId in processList) {
        const process = MemoryManager.processes.find(p => p.id === processId);
        if (!process) continue;

        const processContainer = document.createElement('div');
        processContainer.className = 'memory-segment';
        processContainer.style.borderColor = process.color;
        processContainer.style.backgroundColor = `${process.color}10`;

        const processTitle = document.createElement('div');
        processTitle.className = 'segment-title';
        processTitle.textContent = `${processId} (${process.size} KB)`;
        processTitle.style.backgroundColor = process.color;
        processContainer.appendChild(processTitle);

        // Render each segment for this process
        processList[processId].forEach(segment => {
            const segmentBlocks = segmentGroups[segment.id];
            if (!segmentBlocks || segmentBlocks.length === 0) return;

            const segmentInfo = document.createElement('div');
            segmentInfo.style.fontSize = '0.7rem';
            segmentInfo.style.margin = '4px 0';
            segmentInfo.textContent = `Segment: ${segment.name} (${segment.size} KB)`;
            processContainer.appendChild(segmentInfo);

            const segmentGrid = document.createElement('div');
            segmentGrid.className = 'memory-grid';
            segmentGrid.style.display = 'flex';
            segmentGrid.style.flexWrap = 'wrap';
            segmentGrid.style.gap = '4px';
            segmentGrid.style.minHeight = 'auto';
            segmentGrid.style.background = 'transparent';
            segmentGrid.style.border = '1px solid ' + process.color;
            segmentGrid.style.borderRadius = '4px';
            segmentGrid.style.padding = '4px';
            segmentGrid.style.marginBottom = '8px';

            // Calculate the width of each block
            const blockWidth = calculateBlockWidth(8); // Fixed width for better visuals

            segmentBlocks.forEach(block => {
                const blockElement = document.createElement('div');
                blockElement.className = 'memory-block allocated';
                blockElement.style.width = `${blockWidth}px`;
                blockElement.style.backgroundColor = process.color;
                blockElement.textContent = block.id;

                // Add tooltip with block information
                blockElement.title = `Block ${block.id}\nAddress: ${block.startAddress}-${block.startAddress + MemoryManager.blockSize - 1}\nSize: ${MemoryManager.blockSize} KB\nSegment: ${segment.name}\nProcess: ${processId}`;

                segmentGrid.appendChild(blockElement);
            });

            processContainer.appendChild(segmentGrid);
        });

        memoryGrid.appendChild(processContainer);
    }

    // Render free blocks at the end
    if (freeBlocks.length > 0) {
        const freeContainer = document.createElement('div');
        freeContainer.className = 'memory-segment';
        freeContainer.style.borderColor = '#9ca3af';
        freeContainer.style.backgroundColor = 'rgba(156, 163, 175, 0.1)';

        const freeTitle = document.createElement('div');
        freeTitle.className = 'segment-title';
        freeTitle.textContent = 'Free Memory';
        freeTitle.style.backgroundColor = '#9ca3af';
        freeContainer.appendChild(freeTitle);

        const freeGrid = document.createElement('div');
        freeGrid.className = 'memory-grid';
        freeGrid.style.display = 'flex';
        freeGrid.style.flexWrap = 'wrap';
        freeGrid.style.gap = '4px';
        freeGrid.style.minHeight = 'auto';
        freeGrid.style.background = 'transparent';
        freeGrid.style.border = 'none';
        freeGrid.style.padding = '0';

        // Calculate the width of each block
        const blockWidth = calculateBlockWidth(8); // Fixed width for better visuals

        freeBlocks.forEach(block => {
            const blockElement = document.createElement('div');
            blockElement.className = 'memory-block free';
            blockElement.style.width = `${blockWidth}px`;
            blockElement.textContent = block.id;

            // Add tooltip with block information
            blockElement.title = `Block ${block.id}\nAddress: ${block.startAddress}-${block.startAddress + MemoryManager.blockSize - 1}\nSize: ${MemoryManager.blockSize} KB\nStatus: Free`;

            freeGrid.appendChild(blockElement);
        });

        freeContainer.appendChild(freeGrid);
        memoryGrid.appendChild(freeContainer);
    }
}

// Calculate appropriate block width
function calculateBlockWidth(blockCount) {
    const containerWidth = memoryGrid.clientWidth - 20;
    const minWidth = 30;
    const maxWidth = 70;
    const calculatedWidth = Math.floor(containerWidth / Math.sqrt(blockCount));

    return Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
}

// Render process list with pagination
function renderProcessList() {
    processList.innerHTML = '';

    // Determine if we need pagination
    const totalProcesses = MemoryManager.processes.length;
    totalProcessPages = Math.ceil(totalProcesses / itemsPerPage);

    // Show/hide pagination controls
    processListPagination.style.display = totalProcessPages > 1 ? 'flex' : 'none';

    // Get processes for the current page
    const processesToRender = totalProcessPages > 1
        ? MemoryManager.getPagedProcesses(currentProcessPage, itemsPerPage)
        : MemoryManager.processes;

    // Update pagination
    if (totalProcessPages > 1) {
        renderPagination(processListPagination, currentProcessPage, totalProcessPages, (page) => {
            currentProcessPage = page;
            renderProcessList();
        });
    }

    // Create process list items
    processesToRender.forEach(process => {
        const listItem = document.createElement('li');
        listItem.className = 'process-enter';
        listItem.style.backgroundColor = process.color;

        // Format process information based on type
        let processInfo;
        if (process.type === 'paging') {
            processInfo = `${process.id} (${process.size} KB, ${process.pageCount} pages)`;
        } else if (process.type === 'segmentation') {
            processInfo = `${process.id} (${process.size} KB, ${process.segments?.length} segments)`;
        } else {
            processInfo = `${process.id} (${process.size} KB)`;
        }

        const processInfoSpan = document.createElement('span');
        processInfoSpan.textContent = processInfo;

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Terminate';
        removeButton.addEventListener('click', () => handleRemoveProcess(process.id));

        listItem.appendChild(processInfoSpan);
        listItem.appendChild(removeButton);
        processList.appendChild(listItem);

        // Remove animation class after animation completes
        setTimeout(() => {
            listItem.classList.remove('process-enter');
        }, 300);
    });
}

// Render pagination controls
function renderPagination(container, currentPage, totalPages, onPageChange) {
    container.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = `pagination-btn ${currentPage === 1 ? 'disabled' : ''}`;
    prevBtn.innerHTML = '&laquo;';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    });
    container.appendChild(prevBtn);

    // Page buttons
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page button (if needed)
    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'pagination-btn';
        firstBtn.textContent = '1';
        firstBtn.addEventListener('click', () => onPageChange(1));
        container.appendChild(firstBtn);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-btn disabled';
            ellipsis.textContent = '...';
            container.appendChild(ellipsis);
        }
    }

    // Page buttons
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => onPageChange(i));
        container.appendChild(pageBtn);
    }

    // Last page button (if needed)
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-btn disabled';
            ellipsis.textContent = '...';
            container.appendChild(ellipsis);
        }

        const lastBtn = document.createElement('button');
        lastBtn.className = 'pagination-btn';
        lastBtn.textContent = totalPages;
        lastBtn.addEventListener('click', () => onPageChange(totalPages));
        container.appendChild(lastBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = `pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`;
    nextBtn.innerHTML = '&raquo;';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    });
    container.appendChild(nextBtn);
}

// Update statistics display
function updateStats() {
    const stats = MemoryManager.getStats();

    // Update utilization progress bar
    utilizationProgress.style.width = `${stats.utilizationRate}%`;
    utilizationValue.textContent = `${stats.utilizationRate.toFixed(1)}%`;

    // Update used memory progress bar
    const memoryPercentage = (stats.usedMemory / stats.totalMemory) * 100;
    usedMemoryProgress.style.width = `${memoryPercentage}%`;
    usedMemoryValue.textContent = `${stats.usedMemory} KB / ${stats.totalMemory} KB`;

    // Update other stats
    activeProcessesEl.textContent = stats.activeProcesses;
    fragmentationEl.textContent = stats.fragmentedBlocks;

    // Update paging/segmentation specific stats
    if (stats.memoryType === 'paging') {
        pageCount.textContent = stats.pageCount || 0;
    } else if (stats.memoryType === 'segmentation') {
        segmentCount.textContent = stats.segmentCount || 0;
    }
}

// Handle segment form display when memory type is segmentation
function checkSegmentFormDisplay() {
    if (MemoryManager.memoryType === 'segmentation') {
        addProcessBtn.addEventListener('click', function (e) {
            // If the segment form is not visible and we're in segmentation mode, show it instead of adding a process
            if (processSegmentForm.style.display === 'none') {
                e.preventDefault();
                toggleSegmentForm();
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    init();
    checkSegmentFormDisplay();

    // Add event listeners for memory type buttons
    contiguousBtn.addEventListener('click', () => {
        if (MemoryManager.memoryType === 'contiguous') return;
        setMemoryType('contiguous');
        processSegmentForm.style.display = 'none';
        processSizeInput.parentElement.style.display = 'block';
    });

    pagingBtn.addEventListener('click', () => {
        if (MemoryManager.memoryType === 'paging') return;
        setMemoryType('paging');
        processSegmentForm.style.display = 'none';
        processSizeInput.parentElement.style.display = 'block';
    });

    segmentationBtn.addEventListener('click', () => {
        if (MemoryManager.memoryType === 'segmentation') return;
        setMemoryType('segmentation');
        toggleSegmentForm();
    });
});

// Handle window resize to adjust memory block layout
window.addEventListener('resize', () => {
    renderMemory();
});

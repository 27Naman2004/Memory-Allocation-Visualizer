
// Memory Management Utilities
const MemoryManager = {
    // Configuration
    totalMemory: 1024, // in KB
    blockSize: 64,     // in KB
    algorithm: 'firstFit',
    memoryType: 'contiguous', // 'contiguous', 'paging', or 'segmentation'

    // Paging specific settings
    pageSize: 16,      // in KB
    pageTableEntries: [],

    // Segmentation specific settings
    segmentTable: [],

    // State
    blocks: [],
    processes: [],
    currentPage: 1,
    itemsPerPage: 20,

    // Initialize memory blocks
    initializeMemory() {
        switch (this.memoryType) {
            case 'paging':
                return this.initializePaging();
            case 'segmentation':
                return this.initializeSegmentation();
            case 'contiguous':
            default:
                return this.initializeContiguous();
        }
    },

    // Initialize contiguous memory blocks
    initializeContiguous() {
        const numBlocks = Math.floor(this.totalMemory / this.blockSize);
        this.blocks = Array.from({ length: numBlocks }, (_, index) => ({
            id: index,
            size: this.blockSize,
            isAllocated: false,
            processId: null,
            startAddress: index * this.blockSize,
        }));
        this.processes = [];

        return this.blocks;
    },

    // Initialize paging memory structures
    initializePaging() {
        const totalPages = Math.floor(this.totalMemory / this.pageSize);

        // Create page frames
        this.blocks = Array.from({ length: totalPages }, (_, index) => ({
            id: index,
            size: this.pageSize,
            isAllocated: false,
            processId: null,
            startAddress: index * this.pageSize,
            isPage: true,
            pageNumber: index
        }));

        this.pageTableEntries = [];
        this.processes = [];

        return this.blocks;
    },

    // Initialize segmentation memory structures
    initializeSegmentation() {
        const numBlocks = Math.floor(this.totalMemory / this.blockSize);
        this.blocks = Array.from({ length: numBlocks }, (_, index) => ({
            id: index,
            size: this.blockSize,
            isAllocated: false,
            processId: null,
            startAddress: index * this.blockSize,
            segmentId: null
        }));

        this.segmentTable = [];
        this.processes = [];

        return this.blocks;
    },

    // Get random color for process visualization
    getRandomColor() {
        const colors = [
            '#3b82f6', // blue-500
            '#8b5cf6', // violet-500
            '#ec4899', // pink-500
            '#f43f5e', // rose-500
            '#f97316', // orange-500
            '#f59e0b', // amber-500
            '#10b981', // emerald-500
            '#14b8a6', // teal-500
            '#06b6d4', // cyan-500
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // Calculate memory utilization
    calculateUtilization() {
        const totalBlocks = this.blocks.length;
        const allocatedBlocks = this.blocks.filter(block => block.isAllocated).length;
        return totalBlocks > 0 ? (allocatedBlocks / totalBlocks) * 100 : 0;
    },

    // Count fragmented blocks (free blocks surrounded by allocated blocks)
    countFragmentedBlocks() {
        if (this.memoryType === 'paging') {
            // In paging, fragmentation is minimal to none
            return 0;
        }

        let count = 0;
        for (let i = 1; i < this.blocks.length - 1; i++) {
            if (!this.blocks[i].isAllocated &&
                this.blocks[i - 1].isAllocated &&
                this.blocks[i + 1].isAllocated &&
                this.blocks[i - 1].processId !== this.blocks[i + 1].processId) {
                count++;
            }
        }
        return count;
    },

    // First Fit algorithm (for contiguous allocation)
    firstFit(processSize) {
        const requiredBlocks = Math.ceil(processSize / this.blockSize);

        for (let i = 0; i <= this.blocks.length - requiredBlocks; i++) {
            let canFit = true;

            for (let j = 0; j < requiredBlocks; j++) {
                if (this.blocks[i + j].isAllocated) {
                    canFit = false;
                    break;
                }
            }

            if (canFit) {
                return i;
            }
        }

        return -1; // No suitable space found
    },

    // Best Fit algorithm (for contiguous allocation)
    bestFit(processSize) {
        const requiredBlocks = Math.ceil(processSize / this.blockSize);
        let bestFitIndex = -1;
        let bestFitSize = Infinity;

        for (let i = 0; i <= this.blocks.length - requiredBlocks; i++) {
            let consecutiveFreeBlocks = 0;

            for (let j = i; j < this.blocks.length; j++) {
                if (this.blocks[j].isAllocated) {
                    break;
                }
                consecutiveFreeBlocks++;
            }

            if (consecutiveFreeBlocks >= requiredBlocks && consecutiveFreeBlocks < bestFitSize) {
                bestFitSize = consecutiveFreeBlocks;
                bestFitIndex = i;
            }
        }

        return bestFitIndex;
    },

    // Worst Fit algorithm (for contiguous allocation)
    worstFit(processSize) {
        const requiredBlocks = Math.ceil(processSize / this.blockSize);
        let worstFitIndex = -1;
        let worstFitSize = 0;

        for (let i = 0; i <= this.blocks.length - requiredBlocks; i++) {
            let consecutiveFreeBlocks = 0;

            for (let j = i; j < this.blocks.length; j++) {
                if (this.blocks[j].isAllocated) {
                    break;
                }
                consecutiveFreeBlocks++;
            }

            if (consecutiveFreeBlocks >= requiredBlocks && consecutiveFreeBlocks > worstFitSize) {
                worstFitSize = consecutiveFreeBlocks;
                worstFitIndex = i;
            }
        }

        return worstFitIndex;
    },

    // Find free pages for paging allocation
    findFreePages(numPages) {
        const freePageIndices = [];

        for (let i = 0; i < this.blocks.length; i++) {
            if (!this.blocks[i].isAllocated) {
                freePageIndices.push(i);
                if (freePageIndices.length === numPages) {
                    break;
                }
            }
        }

        return freePageIndices.length === numPages ? freePageIndices : [];
    },

    // Allocate memory for a process
    allocateMemory(processSize, segments = null) {
        switch (this.memoryType) {
            case 'paging':
                return this.allocateWithPaging(processSize);
            case 'segmentation':
                return this.allocateWithSegmentation(segments || [{ name: 'default', size: processSize }]);
            case 'contiguous':
            default:
                return this.allocateContiguous(processSize);
        }
    },

    // Allocate memory with contiguous allocation
    allocateContiguous(processSize) {
        const requiredBlocks = Math.ceil(processSize / this.blockSize);

        let startIndex = -1;

        // Determine allocation strategy based on selected algorithm
        switch (this.algorithm) {
            case 'bestFit':
                startIndex = this.bestFit(processSize);
                break;
            case 'worstFit':
                startIndex = this.worstFit(processSize);
                break;
            case 'firstFit':
            default:
                startIndex = this.firstFit(processSize);
                break;
        }

        // If no suitable space found
        if (startIndex === -1) {
            return { success: false };
        }

        // Generate a unique process ID
        const processId = `P${this.processes.length + 1}`;

        // Create a new process
        const newProcess = {
            id: processId,
            size: processSize,
            color: this.getRandomColor(),
            startTime: Date.now(),
            type: 'contiguous',
            startBlock: startIndex,
            numBlocks: requiredBlocks
        };

        // Add the process to the list
        this.processes.push(newProcess);

        // Allocate the required blocks
        for (let i = 0; i < requiredBlocks; i++) {
            this.blocks[startIndex + i] = {
                ...this.blocks[startIndex + i],
                isAllocated: true,
                processId: processId,
            };
        }

        return { success: true, process: newProcess };
    },

    // Allocate memory with paging
    allocateWithPaging(processSize) {
        const requiredPages = Math.ceil(processSize / this.pageSize);
        const freePageIndices = this.findFreePages(requiredPages);

        // If not enough free pages found
        if (freePageIndices.length === 0) {
            return { success: false };
        }

        // Generate a unique process ID
        const processId = `P${this.processes.length + 1}`;

        // Create page table for this process
        const pageTable = freePageIndices.map((frameIndex, logicalPageNum) => ({
            logicalPage: logicalPageNum,
            physicalFrame: frameIndex,
            frameAddress: this.blocks[frameIndex].startAddress
        }));

        // Create a new process
        const newProcess = {
            id: processId,
            size: processSize,
            color: this.getRandomColor(),
            startTime: Date.now(),
            type: 'paging',
            pageTable: pageTable,
            pageCount: requiredPages
        };

        // Add the process to the list
        this.processes.push(newProcess);

        // Add to page table entries
        this.pageTableEntries.push(...pageTable.map(entry => ({
            ...entry,
            processId: processId
        })));

        // Allocate the required pages
        for (const frameIndex of freePageIndices) {
            this.blocks[frameIndex] = {
                ...this.blocks[frameIndex],
                isAllocated: true,
                processId: processId,
            };
        }

        return { success: true, process: newProcess };
    },

    // Allocate memory with segmentation
    allocateWithSegmentation(segments) {
        if (!segments || segments.length === 0) {
            return { success: false };
        }

        // Generate a unique process ID
        const processId = `P${this.processes.length + 1}`;
        const processColor = this.getRandomColor();

        // Try to allocate each segment
        const allocatedSegments = [];
        const totalSize = segments.reduce((total, segment) => total + segment.size, 0);

        for (const segment of segments) {
            const requiredBlocks = Math.ceil(segment.size / this.blockSize);
            let startIndex = -1;

            // Determine allocation strategy based on selected algorithm
            switch (this.algorithm) {
                case 'bestFit':
                    startIndex = this.bestFit(segment.size);
                    break;
                case 'worstFit':
                    startIndex = this.worstFit(segment.size);
                    break;
                case 'firstFit':
                default:
                    startIndex = this.firstFit(segment.size);
                    break;
            }

            // If not enough space for this segment, deallocate previous segments and fail
            if (startIndex === -1) {
                // Deallocate previous segments
                for (const allocatedSegment of allocatedSegments) {
                    for (let i = 0; i < allocatedSegment.numBlocks; i++) {
                        const blockIndex = allocatedSegment.startBlock + i;
                        this.blocks[blockIndex] = {
                            ...this.blocks[blockIndex],
                            isAllocated: false,
                            processId: null,
                            segmentId: null
                        };
                    }
                }

                return { success: false };
            }

            // Create segment entry
            const segmentId = `${processId}-${segment.name}`;
            const segmentEntry = {
                id: segmentId,
                name: segment.name,
                size: segment.size,
                startBlock: startIndex,
                numBlocks: requiredBlocks,
                processId: processId
            };

            // Allocate blocks for this segment
            for (let i = 0; i < requiredBlocks; i++) {
                this.blocks[startIndex + i] = {
                    ...this.blocks[startIndex + i],
                    isAllocated: true,
                    processId: processId,
                    segmentId: segmentId
                };
            }

            allocatedSegments.push(segmentEntry);
        }

        // Add segment table entries
        this.segmentTable.push(...allocatedSegments);

        // Create a new process
        const newProcess = {
            id: processId,
            size: totalSize,
            color: processColor,
            startTime: Date.now(),
            type: 'segmentation',
            segments: allocatedSegments,
            segmentCount: segments.length
        };

        // Add the process to the list
        this.processes.push(newProcess);

        return { success: true, process: newProcess };
    },

    // Deallocate memory for a process
    deallocateMemory(processId) {
        const process = this.processes.find(p => p.id === processId);

        if (!process) {
            return { success: false };
        }

        switch (process.type) {
            case 'paging':
                // Remove from page table entries
                this.pageTableEntries = this.pageTableEntries.filter(entry => entry.processId !== processId);
                break;
            case 'segmentation':
                // Remove from segment table
                this.segmentTable = this.segmentTable.filter(segment => segment.processId !== processId);
                break;
            default:
                break;
        }

        // Update blocks to free memory used by the process
        this.blocks = this.blocks.map(block => {
            if (block.processId === processId) {
                return {
                    ...block,
                    isAllocated: false,
                    processId: null,
                    segmentId: null
                };
            }
            return block;
        });

        // Remove the process from the list
        this.processes = this.processes.filter(process => process.id !== processId);

        return { success: true };
    },

    // Paginate data for display
    paginate(items, page, itemsPerPage) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return items.slice(startIndex, endIndex);
    },

    // Get paged memory blocks
    getPagedBlocks(page, itemsPerPage) {
        return this.paginate(this.blocks, page, itemsPerPage);
    },

    // Get paged processes
    getPagedProcesses(page, itemsPerPage) {
        return this.paginate(this.processes, page, itemsPerPage);
    },

    // Get statistics about memory usage
    getStats() {
        const utilizationRate = this.calculateUtilization();
        const fragmentedBlocks = this.countFragmentedBlocks();
        const usedMemory = this.blocks.filter(block => block.isAllocated).length * (this.memoryType === 'paging' ? this.pageSize : this.blockSize);

        let stats = {
            utilizationRate,
            fragmentedBlocks,
            usedMemory,
            totalMemory: this.totalMemory,
            activeProcesses: this.processes.length,
            memoryType: this.memoryType
        };

        if (this.memoryType === 'paging') {
            stats.pageCount = this.pageTableEntries.length;
            stats.pageSize = this.pageSize;
        }

        if (this.memoryType === 'segmentation') {
            stats.segmentCount = this.segmentTable.length;
        }

        return stats;
    }
};

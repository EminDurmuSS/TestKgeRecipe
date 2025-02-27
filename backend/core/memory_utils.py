import os
import gc
import logging
import torch
import psutil

logger = logging.getLogger(__name__)

def log_memory_usage(tag: str = ""):
    """Log current memory usage for debugging purposes."""
    try:
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        
        # Convert to MB for readability
        rss_mb = memory_info.rss / (1024 * 1024)
        vms_mb = memory_info.vms / (1024 * 1024)
        
        logger.info(f"MEMORY USAGE {tag}: RSS={rss_mb:.2f}MB, VMS={vms_mb:.2f}MB")
        
        # If pytorch is being used, log its memory usage too
        if torch.cuda.is_available():
            allocated = torch.cuda.memory_allocated() / (1024 * 1024)
            reserved = torch.cuda.memory_reserved() / (1024 * 1024)
            logger.info(f"CUDA MEMORY {tag}: Allocated={allocated:.2f}MB, Reserved={reserved:.2f}MB")
    
    except Exception as e:
        logger.error(f"Error logging memory usage: {str(e)}")

def clean_memory():
    """Attempt to free unused memory."""
    try:
        # Run Python's garbage collector
        collected = gc.collect(generation=2)
        logger.debug(f"GC collected {collected} objects")
        
        # Free PyTorch cache if available
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.debug("PyTorch CUDA cache cleared")
    
    except Exception as e:
        logger.error(f"Error cleaning memory: {str(e)}")
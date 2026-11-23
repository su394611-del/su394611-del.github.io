"""Allow `python -m ailab_playground`."""

import sys

from .cli import main

sys.exit(main())

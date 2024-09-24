import os
import sys
import yt_dlp
import soundfile as sf
import msgpack
import numpy as np

URLS = ["https://www.youtube.com/watch?v=" + sys.argv[1]]

ydl_opts = {
    "format": "worstaudio",
    # ℹ️ See help(yt_dlp.postprocessor) for a list of available Postprocessors and their arguments
    "postprocessors": [
        {  # Extract audio using ffmpeg
            "key": "FFmpegExtractAudio",
            "preferredcodec": "wav",
        }
    ],
    "outtmpl": "nikochan-" + sys.argv[1],
}

with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    error_code = ydl.download(URLS)

sig, sr = sf.read("nikochan-" + sys.argv[1] + ".wav")
sample_reduce = sr // 1000
sampled = [
    int(np.max(np.abs(sig[i - sample_reduce : i, 0])) * 127)
    for i in range(sample_reduce, sig.shape[0], sample_reduce)
]
with open("nikochan-" + sys.argv[1] + "-sampled", "wb") as f:
    f.write(msgpack.packb(sampled))
os.remove("nikochan-" + sys.argv[1] + ".wav")

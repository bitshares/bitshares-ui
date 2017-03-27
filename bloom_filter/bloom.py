#!/usr/bin/env python3

# Matching exmaple:
# ./bloom.py BTS87mopaNqLDjT1BvzqQR3QjWzWSTgkWnMcwt5sqxHuavCBi1s3m

# Sample program by theoriticalbts used to create js implementation

import hashlib
import sys

k = sys.argv[1]

# specified with -s parameter
size = 8388608

# specified with -n parameter
hashes = 3

with open("bloom.dat", "rb") as f:
    filter_result = True

    for i in range(hashes):
        x = (str(i)+":"+k).encode("UTF-8")
        print("getting hash of ", repr(x))
        hash = hashlib.sha256(x).hexdigest()
        print("hash value is ", repr(hash))
        bit_address = int(hash, 16) % size
        print("bit address is", hex(bit_address))
        byte_address = bit_address >> 3
        print("byte address is", hex(byte_address))
        mask = 1 << (bit_address & 7)
        print("mask is", hex(mask))
        f.seek(byte_address)
        b = f.read(1)
        print("byte is", hex(b[0]))
        # print("b[0] & mask", b[0] & mask)
        ok = (b[0] & mask)
        print("ok", ok, ok == 0)
        if ok == 0:
            filter_result = False
            print("returning False result")
            break
    print("filter_result is", filter_result)

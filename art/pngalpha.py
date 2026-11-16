import sys, zlib, struct
def read(path):
    d=open(path,'rb').read(); assert d[:8]==b'\x89PNG\r\n\x1a\n'
    i=8; idat=b''; w=h=0
    while i<len(d):
        n,=struct.unpack('>I',d[i:i+4]); t=d[i+4:i+8]; c=d[i+8:i+8+n]; i+=12+n
        if t==b'IHDR': w,h,bd,ct=struct.unpack('>IIBB',c[:10]); assert bd==8, bd; ch={6:4,2:3,4:2,0:1}[ct]
        elif t==b'IDAT': idat+=c
    raw=zlib.decompress(idat); stride=w*ch; rows=[]; prev=bytearray(stride); p=0
    for y in range(h):
        f=raw[p]; line=bytearray(raw[p+1:p+1+stride]); p+=1+stride
        for x in range(stride):
            a=line[x-ch] if x>=ch else 0; b=prev[x]; c=prev[x-ch] if x>=ch else 0
            if f==1: line[x]=(line[x]+a)&255
            elif f==2: line[x]=(line[x]+b)&255
            elif f==3: line[x]=(line[x]+((a+b)>>1))&255
            elif f==4:
                pa,pb,pc=abs(b-c),abs(a-c),abs(a+b-2*c)
                pr=a if pa<=pb and pa<=pc else (b if pb<=pc else c); line[x]=(line[x]+pr)&255
        rows.append(line); prev=line
    return w,h,ch,rows
for path in sys.argv[1:]:
    w,h,ch,rows=read(path)
    if ch!=4: print(path,'no alpha channel'); continue
    al=[rows[y][x*4+3] for y in range(0,h,8) for x in range(0,w,8)]
    clear=sum(1 for a in al if a==0)/len(al); partial=sum(1 for a in al if 0<a<255)/len(al)
    corner=rows[2][2*4+3]
    print(f"{path}: corner alpha={corner} fully-transparent={clear:.0%} semi={partial:.0%}")

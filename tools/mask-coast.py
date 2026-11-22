# Masque de la côte : la mer peinte devient presque transparente (l'océan animé transparaît),
# la terre, la plage, la jetée et les toits restent opaques.
from PIL import Image, ImageFilter

ROOT = r'C:\Users\p.rouby\Desktop\Moussaillon\ecole-moussaillon.github.io'
src = Image.open(ROOT + r'\assets\port-coast.webp').convert('RGB')
w, h = src.size
print('source', w, h)

H, S, V = src.convert('HSV').split()
Hd, Sd, Vd = H.load(), S.load(), V.load()

LIM = 560          # la mer peinte n'existe que dans le haut de l'image (le ruisseau plus bas est préservé)
sea = Image.new('L', (w, h), 0)
b = sea.load()
for y in range(LIM):
    for x in range(w):
        if y >= 80 and x >= 550:
            continue  # le bourg et la jetée : toits turquoise et auvents verts restent opaques
        hh, ss, vv = Hd[x, y], Sd[x, y], Vd[x, y]
        if 105 <= hh <= 162 and ss >= 48 and vv >= 45:
            b[x, y] = 255

# Fermeture (écume blanche incluse) puis bords adoucis
closed = sea.filter(ImageFilter.GaussianBlur(6)).point(lambda v: 255 if v > 72 else 0)
feather = closed.filter(ImageFilter.GaussianBlur(10))
alpha = feather.point(lambda v: 255 - int(v * 0.84))   # cœur de mer -> alpha ~41 (16 %)

# Raccord du haut : fondu vers 0 sur 48 px pour que la couture avec l'océan animé reste invisible
pa = alpha.load()
for y in range(48):
    f = y / 48
    for x in range(w):
        pa[x, y] = int(pa[x, y] * f)

black = Image.new('L', (w, h), 0)
out = Image.merge('RGBA', (black, black, black, alpha))
out.save(ROOT + r'\assets\coast-mask.webp', 'WEBP', quality=86)

# Aperçu : l'image posée sur un fond magenta à travers le masque
bg = Image.new('RGB', (w, h), (200, 40, 160))
comp = Image.composite(src, bg, alpha)
comp.thumbnail((640, 960))
comp.save(r'C:\Users\P9C13~1.ROU\AppData\Local\Temp\claude\d2ac8485093896e5\1d208343-0059-4793-9570-07a0d033c20a\scratchpad\apercu-mask.jpg', quality=88)
print('ok')

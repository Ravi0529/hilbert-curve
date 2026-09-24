def is_power_of_two(n: int) -> bool:
    return n > 0 and (n & (n - 1)) == 0


def d_to_xy(n: int, d: int) -> tuple[int, int]:
    """
    Convert Hilbert curve distance d into (x, y).

    n must be a power of 2.
    d must be in [0, n*n).
    """

    if not is_power_of_two(n):
        raise ValueError(f"n must be a power of 2, got {n}")

    if d < 0 or d >= n * n:
        raise ValueError(f"d must be between 0 and {n * n - 1}")

    x = 0
    y = 0

    t = d
    s = 1

    while s < n:
        rx = 1 & (t // 2)
        ry = 1 & (t ^ rx)

        if ry == 0:
            if rx == 1:
                x = s - 1 - x
                y = s - 1 - y

            x, y = y, x

        x += s * rx
        y += s * ry

        t //= 4
        s *= 2

    return x, y


def generate_hilbert_path(
    n: int,
) -> list[tuple[int, int]]:
    """
    Generate all coordinates in Hilbert curve order.
    """

    if not is_power_of_two(n):
        raise ValueError(f"n must be a power of 2, got {n}")

    return [d_to_xy(n, d) for d in range(n * n)]

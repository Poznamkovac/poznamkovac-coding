def ip_to_bytes(ip: str) -> bytes:
    """
    Prevedie IPv4 stringovú adresu na bytes.
    IP adresu rozdelíme na štyri časti (oktety) a každý oktet prevedieme na bytes
    """

    octets = ip.split(".")
    b1 = int(octets[0]).to_bytes(1, "big")
    b2 = int(octets[1]).to_bytes(1, "big")
    b3 = int(octets[2]).to_bytes(1, "big")
    b4 = int(octets[3]).to_bytes(1, "big")

    return b1 + b2 + b3 + b4


class IPv4Packet:
    def __init__(
        self,
        version: int,  # verzia (4 alebo 6, podľa toho či je to IPv4 alebo IPv6)
        ihl: int,  # dĺžka hlavičky v 32-bitových slovách (4 bity)
        dscp: int,  # Differentiated Services Code Point (6 bitov)
        ecn: int,  # Explicit Congestion Notification (2 bity)
        total_length: int,  # celková dĺžka paketu vrátane hlavičky (16 bitov)
        identification: int,  # identifikátor (16 bitov)
        dont_fragment: bool,  # DF vlajka (boolean, 1 bit)   \  príznaky
        more_fragments: bool,  # MF vlajka (boolean, 1 bit)  /  (3 bity), prvý bit je vždy 0 pretože je vyhradený
        fragment_offset: int,  # posun fragmentu (13 bitov)
        ttl: int,  # Time To Live (8 bitov)
        protocol: int,  # protokol (8 bitov), napr. 6 = TCP, 17 = UDP
        header_checksum: int,  # kontrolný súčet hlavičky (16 bitov)
        source_address: str,  # IP adresa zdroja (4 oktety, spolu 32 bitov)
        destination_address: str,  # IP adresa cieľa (4 oktety, spolu 32 bitov)
        options: bytes | None = None,  # voliteľné rozšírenia hlavičky (max 40 bajtov)
        data: bytes = b"",  # užívateľské dáta (obsah paketu, to čo posielame)
    ):
        self.version = version  # verzia (4 bity), zvyčajne 4
        self.ihl = ihl  # dĺžka hlavičky v 32-bitových slovách (4 bity)
        self.dscp = dscp  # Differentiated Services Code Point (6 bitov)
        self.ecn = ecn  # Explicit Congestion Notification (2 bity)
        self.total_length = (
            total_length  # celková dĺžka paketu vrátane hlavičky (16 bitov)
        )
        self.identification = identification  # identifikátor (16 bitov)

        # Vlajky a posun fragmentu
        self.dont_fragment = dont_fragment  # DF vlajka (boolean, 1 bit)
        self.more_fragments = more_fragments  # MF vlajka (boolean, 1 bit)
        self.fragment_offset = fragment_offset  # posun fragmentu (13 bitov)

        # Ďalšie polia
        self.ttl = ttl  # Time To Live (8 bitov)
        self.protocol = protocol  # protokol (8 bitov), napr. 6 = TCP, 17 = UDP
        self.header_checksum = header_checksum  # kontrolný súčet hlavičky (16 bitov)

        # IP adresy ako reťazce "a.b.c.d"
        self.source_address = source_address
        self.destination_address = destination_address

        # Voliteľné rozšírenia hlavičky a užívateľské dáta
        if options is None:
            self.options = b""
        else:
            if len(options) > 40:
                raise ValueError("rozšírenia hlavičky môžu mať maximálne 40 bajtov")
            self.options = options
        self.data = data

    def to_bytes(self) -> bytes:
        """
        Prevedie paket na bytes.
        """

        # 1) Version + IHL (1 bajt)
        #    verzia v hornej polovici (4 bity), IHL v dolnej polovici (4 bity)
        version_ihl_value = self.version * 16 + self.ihl
        version_ihl_byte = version_ihl_value.to_bytes(1, "big")

        # 2) DSCP + ECN (1 bajt)
        #    DSCP v hornej časti (6 bitov), ECN v spodných 2 bitoch
        dscp_ecn_value = self.dscp * 4 + self.ecn
        dscp_ecn_byte = dscp_ecn_value.to_bytes(1, "big")

        # 3) Total Length (2 bajty)
        total_length_bytes = self.total_length.to_bytes(2, "big")

        # 4) Identification (2 bajty)
        identification_bytes = self.identification.to_bytes(2, "big")

        # 5) Flags + Fragment Offset (2 bajty)
        #    Flags sú tri bity: reserved (0), DF, MF; potom 13-bit posun
        flags_offset_value = self.fragment_offset
        if self.dont_fragment:
            # DF bit = 2**14
            flags_offset_value = flags_offset_value + 2**14
        if self.more_fragments:
            # MF bit = 2**13
            flags_offset_value = flags_offset_value + 2**13
        flags_offset_bytes = flags_offset_value.to_bytes(2, "big")

        # 6) TTL (1 bajt) a Protocol (1 bajt)
        ttl_byte = self.ttl.to_bytes(1, "big")
        protocol_byte = self.protocol.to_bytes(1, "big")

        # 7) Header Checksum (2 bajty)
        checksum_bytes = self.header_checksum.to_bytes(2, "big")

        # 8) Source Address (4 bajty)
        source_bytes = ip_to_bytes(self.source_address)

        # 9) Destination Address (4 bajty)
        destination_bytes = ip_to_bytes(self.destination_address)

        # 10) Poskladáme celú hlavičku
        header = (
            version_ihl_byte
            + dscp_ecn_byte
            + total_length_bytes
            + identification_bytes
            + flags_offset_bytes
            + ttl_byte
            + protocol_byte
            + checksum_bytes
            + source_bytes
            + destination_bytes
            + self.options
        )

        # 11) Pridáme dáta aplikácie (obsah toho, čo posielame) za hlavičku
        packet = header + self.data
        return packet

    def to_binary(self) -> str:
        """
        Prevedie paket na binárny reťazec jednotiek a núl.
        """

        return " ".join(f"{b:08b}" for b in self.to_bytes())

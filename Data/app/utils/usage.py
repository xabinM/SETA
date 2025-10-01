# app/utils/usage.py

from typing import Tuple

AVG_TOKENS_PER_PROMPT = 100  # ⚠️ 프로젝트 기준값: 1건 ≈ 100 tokens

COST_PER_PROMPT_USD = 0.001
ENERGY_WH_PER_PROMPT = 0.24
CO2_G_PER_PROMPT = 0.03
WATER_ML_PER_PROMPT = 0.26

# 토큰당 환산치
COST_PER_TOKEN = COST_PER_PROMPT_USD / AVG_TOKENS_PER_PROMPT
ENERGY_WH_PER_TOKEN = ENERGY_WH_PER_PROMPT / AVG_TOKENS_PER_PROMPT
CO2_G_PER_TOKEN = CO2_G_PER_PROMPT / AVG_TOKENS_PER_PROMPT
WATER_ML_PER_TOKEN = WATER_ML_PER_PROMPT / AVG_TOKENS_PER_PROMPT

def estimate_usage_by_tokens(tokens: int):
    """토큰 수 기준 소비량 추정"""
    cost = COST_PER_TOKEN * tokens
    energy = ENERGY_WH_PER_TOKEN * tokens
    co2 = CO2_G_PER_TOKEN * tokens
    water = WATER_ML_PER_TOKEN * tokens
    return cost, energy, co2, water


def estimate_usage(num_prompts: int = 1) -> Tuple[float, float, float, float]:
    """
    요청 건수 기준으로 소비량 추정
    :param num_prompts: 프롬프트 건수
    :return: (cost_usd, energy_wh, co2_g, water_ml)
    """
    cost = COST_PER_PROMPT_USD * num_prompts
    energy = ENERGY_WH_PER_PROMPT * num_prompts
    co2 = CO2_G_PER_PROMPT * num_prompts
    water = WATER_ML_PER_PROMPT * num_prompts
    return cost, energy, co2, water
